'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logAudit, AUDIT_ACTIONS } from '@/utils/audit'
import { sendProjectCompletedEmail } from '@/utils/email'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Ambil data user yang sedang login + organization_id mereka
//
// 📖 Kenapa ini penting?
//    Setiap server action yang ubah data WAJIB tahu:
//    1. Siapa yang request (user ID)
//    2. Mereka dari agency mana (organization_id)
//    Tanpa ini, kita tidak bisa memverifikasi kepemilikan data.
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, orgId: null, error: 'Sesi tidak valid. Silakan login kembali.' }
  }

  // Ambil organization_id dari profil user yang sedang login
  // (Admin sudah punya organization_id yang di-set saat registerAgency)
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { user: null, orgId: null, error: 'Akun ini belum terhubung ke organisasi manapun.' }
  }

  return { user, orgId: profile.organization_id, error: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateWebhookUrl
// ─────────────────────────────────────────────────────────────────────────────

export async function updateWebhookUrl(formData: FormData) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const webhookUrl = (formData.get('webhookUrl') as string)?.trim() || null
  
  if (webhookUrl) {
    if (!webhookUrl.startsWith('https://')) {
      return { error: 'URL Webhook wajib menggunakan protokol https://' }
    }
    // Block localhost, local IPs, and Cloud Metadata IPs (SSRF protection)
    const localIpPattern = /^(https?:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])|169\.254\.)/i
    if (localIpPattern.test(webhookUrl)) {
      return { error: 'URL Webhook tidak boleh menggunakan IP lokal, localhost, atau IP metadata.' }
    }
    try {
      new URL(webhookUrl) // check if parseable
    } catch {
      return { error: 'Format URL Webhook tidak valid.' }
    }
  }

  const supabaseAdmin = createAdminClient()
  
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ webhook_url: webhookUrl })
    .eq('id', orgId)

  if (error) {
    return { error: 'Gagal menyimpan URL Webhook: ' + (error?.message || 'Unknown error') }
  }

  revalidatePath('/dashboard')
  
  // 📝 Catat aksi: webhook diubah
  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email || '',
    action: 'UPDATE_WEBHOOK',
    targetType: 'organization',
    targetId: orgId,
    targetName: 'Webhook Settings',
    metadata: { webhookUrl },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// createClientAccount
// ─────────────────────────────────────────────────────────────────────────────

export async function createClientAccount(formData: FormData) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const email    = (formData.get('email')    as string)?.trim()
  const password = (formData.get('password') as string)
  const fullName = (formData.get('fullName') as string)?.trim()
  const whatsappNumber = (formData.get('whatsapp_number') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const supplierGoods = (formData.get('supplier_goods') as string)?.trim() || null
  const requestedRole = (formData.get('role') as string) === 'supplier' ? 'supplier' : 'client'

  if (!email || !password || !fullName) {
    return { error: 'Semua field wajib diisi.' }
  }

  const supabaseAdmin = createAdminClient()

  // Buat user baru di Supabase Auth
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) return { error: createError.message }
  if (!authData.user) return { error: 'Gagal membuat akun.' }

  // Set role = 'client' (atau 'supplier') dan hubungkan ke org admin yang sedang login
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: fullName,
      whatsapp_number: whatsappNumber,
      address: address,
      supplier_goods: supplierGoods,
      role: requestedRole,
      organization_id: orgId, // ← org milik admin yang lagi login, bukan dari input user
    })
    .eq('id', authData.user.id)

  if (profileError) {
    // Rollback: hapus auth user jika profile gagal diupdate
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Gagal menyimpan profil klien.' }
  }

  revalidatePath('/dashboard')

  // 📝 Catat aksi: klien baru dibuat
  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: AUDIT_ACTIONS.CLIENT_CREATE,
    targetType: 'client',
    targetId: authData.user.id,
    targetName: fullName,
    metadata: { email },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// createClientProject
// ─────────────────────────────────────────────────────────────────────────────

export async function createClientProject(formData: FormData) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const clientId    = formData.get('clientId')    as string
  const title       = formData.get('title')        as string
  const serviceType = formData.get('serviceType')  as string
  
  const rawTotalPrice = formData.get('totalPrice') as string
  const totalPrice    = parseInt(rawTotalPrice?.replace(/\D/g, '')) || 0

  const rawDpPaid = formData.get('dpPaid') as string
  const dpPaid    = parseInt(rawDpPaid?.replace(/\D/g, '')) || 0

  const deadline = formData.get('deadline') as string || null

  if (!clientId || !title || !serviceType) {
    return { error: 'Data proyek tidak lengkap.' }
  }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: verifikasi clientId memang ada di org kita
  //    Kita cek di profiles: apakah client tersebut punya organization_id yang sama
  const { data: clientProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', clientId)
    .eq('organization_id', orgId) // ← Filter ganda: ID + harus milik org kita
    .single()

  if (!clientProfile) {
    return { error: 'Klien tidak ditemukan atau bukan bagian dari organisasi Anda.' }
  }

  // Ambil service_class dan service_category dari agency_services berdasarkan nama jasa
  const { data: agencyService } = await supabaseAdmin
    .from('agency_services')
    .select('service_class, service_category')
    .eq('organization_id', orgId)
    .eq('name', serviceType)
    .single()

  const serviceClass = agencyService?.service_class || 'digital_umum'
  const projectCategory = agencyService?.service_category || 'DIGITAL'

  const { error } = await supabaseAdmin
    .from('projects')
    .insert({
      organization_id: orgId,   // ← Selalu dari server, bukan dari input
      client_id: clientId,
      title,
      service_type: serviceType,
      service_class: serviceClass,
      project_category: projectCategory,
      total_price: totalPrice,
      termin_1: dpPaid,
      termin_2: 0,
      termin_3: 0,
      payment_status: 'pending',
      progress_percentage: 0,
      status: 'briefing',
      deadline,
    })

  if (error) return { error: 'Gagal membuat proyek.' }

  // 📝 Catat aksi: proyek baru dibuat
  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: AUDIT_ACTIONS.PROJECT_CREATE,
    targetType: 'project',
    targetName: title,
    metadata: { service_type: serviceType, total_price: totalPrice, client_id: clientId },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateProjectStatus
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProjectStatus(projectId: string, status: string, progress: number) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // Ambil data lama untuk mengecek perubahan status dan data email
  const { data: existingProject, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('status, title, profiles(full_name, email), organizations(name)')
    .eq('id', projectId)
    .single()
    
  if (fetchError) {
    console.error('Error fetching existing project for status update:', fetchError)
  }

  const oldStatus = existingProject?.status

  // 🔒 IDOR Prevention: .eq('organization_id', orgId) memastikan
  //    admin hanya bisa update project milik org-nya sendiri.
  //    Jika projectId milik org lain, query tidak akan match → 0 rows updated.
  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      status,
      progress_percentage: Math.min(100, Math.max(0, progress)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('organization_id', orgId) // ← Kunci anti-IDOR

  if (error) return { error: 'Gagal update status proyek.' }

  // 📝 Catat aksi: status proyek diupdate
  const { user } = await getAuthenticatedUser()
  if (user) {
    await logAudit({
      organizationId: orgId,
      actorId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.PROJECT_UPDATE_STATUS,
      targetType: 'project',
      targetId: projectId,
      metadata: { new_status: status, new_progress: progress },
    })
  }

  // 📧 Kirim notifikasi email jika proyek baru saja diselesaikan
  if (status === 'completed' && oldStatus !== 'completed' && existingProject) {
    const profile = existingProject.profiles as any
    const org = existingProject.organizations as any
    
    const clientEmail = profile?.email
    const clientName = profile?.full_name || 'Klien'
    const projectName = existingProject.title
    const agencyName = org?.name || 'Agensi'

    if (clientEmail) {
      sendProjectCompletedEmail({
        clientEmail,
        clientName,
        projectName,
        agencyName
      }).catch(err => console.error('Background email task failed:', err))
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateProjectDetails
// ─────────────────────────────────────────────────────────────────────────────

export async function markProjectReadyToBill(projectId: string) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()
  
  // Ambil profil user untuk notifikasi email/nama (jika perlu)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Pastikan yang mencet tombol ini bukan eksekutor biasa? Atau ops boleh. 
  
  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email || '',
    action: 'UPDATE_PROJECT',
    targetType: 'project',
    targetId: projectId,
    targetName: 'Handoff ke Keuangan',
    metadata: { note: 'Proyek siap ditagih' },
  })

  // (Opsional) Disini bisa ditambah fitur pengiriman email ke divisi keuangan.
  
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL NOTES
// ─────────────────────────────────────────────────────────────────────────────

export async function addInternalNote(formData: FormData) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const projectId = formData.get('projectId') as string
  const content = formData.get('content') as string
  
  if (!projectId || !content?.trim()) {
    return { error: 'Komentar tidak boleh kosong' }
  }

  const supabaseAdmin = createAdminClient()

  // Verifikasi proyek milik organisasi yang sama
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  const { error } = await supabaseAdmin
    .from('internal_notes')
    .insert({
      project_id: projectId,
      organization_id: orgId,
      author_id: user.id,
      content: content.trim()
    })

  if (error) {
    return { error: 'Gagal mengirim catatan internal: ' + error.message }
  }

  revalidatePath(`/dashboard/project/${projectId}`)
  return { success: true }
}

export async function updateProjectDetails(projectId: string, formData: FormData) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const status    = formData.get('status')   as string
  let   progress  = parseInt(formData.get('progress')   as string) || 0
  if (progress > 100) progress = 100
  if (progress < 0)   progress = 0

  const rawTotalPrice = formData.get('totalPrice') as string
  const totalPrice = parseInt(rawTotalPrice?.replace(/\D/g, '')) || 0
  const deadline   = (formData.get('deadline') as string) || null

  const rawTermin1 = formData.get('termin1') as string
  const rawTermin2 = formData.get('termin2') as string  
  const rawTermin3 = formData.get('termin3') as string
  const termin1 = parseInt(rawTermin1?.replace(/\D/g, '')) || 0
  const termin2 = parseInt(rawTermin2?.replace(/\D/g, '')) || 0
  const termin3 = parseInt(rawTermin3?.replace(/\D/g, '')) || 0

  // Hitung payment_status berdasarkan total invoice PAID (bukan termin manual)
  // totalPrice dipakai sebagai referensi target
  // payment_status akan di-recalculate dari fin_invoices di query terpisah

  // ─── Tentukan kategori proyek dari form ───────────────────────────────────
  const projectCategory = (formData.get('projectCategory') as string) ?? 'DIGITAL'

  const supabaseAdmin = createAdminClient()

  // Ambil data lama untuk cek status dan kirim email
  const { data: existingProject, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('status, title, profiles(full_name, email), organizations(name)')
    .eq('id', projectId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching existing project:', fetchError)
  }

  const oldStatus = existingProject?.status

  // ─── Update tabel INDUK (projects) ───────────────────────────────────────
  // Hanya menyimpan field INTI yang universal. Field spesifik pergi ke tabel anak.
  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      status,
      progress_percentage: progress,
      total_price: totalPrice,
      termin_1: termin1,
      termin_2: termin2,
      termin_3: termin3,
      deadline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('organization_id', orgId) // ← Kunci anti-IDOR

  if (error) return { error: 'Gagal menyimpan perubahan proyek.' }

  // ─── Update TABEL ANAK berdasarkan kategori ───────────────────────────────
  if (projectCategory === 'DIGITAL') {
    const previewUrl       = (formData.get('previewUrl')       as string) || null
    const linkYoutube      = (formData.get('linkYoutube')      as string) || null
    const linkCloudinary   = (formData.get('linkCloudinary')   as string) || null
    const warrantyMonths   = parseInt(formData.get('warrantyMonths') as string) || 0
    const domainName       = (formData.get('domainName')       as string) || null
    const domainExpiryDate = (formData.get('domainExpiryDate') as string) || null
    const hostingInfo      = (formData.get('hostingInfo')      as string) || null
    const warrantyExpiredAt = (formData.get('warrantyExpiredAt') as string) || null
    const platform         = (formData.get('platform')         as string) || null
    const designNotes      = (formData.get('designNotes')      as string) || null

    // UPSERT: insert jika belum ada, update jika sudah ada
    await supabaseAdmin
      .from('project_digital_details')
      .upsert({
        project_id:         projectId,
        preview_url:        previewUrl,
        link_youtube:       linkYoutube,
        link_cloudinary:    linkCloudinary,
        warranty_months:    warrantyMonths,
        domain_name:        domainName,
        domain_expiry_date: domainExpiryDate,
        hosting_info:       hostingInfo,
        warranty_expired_at: warrantyExpiredAt,
        platform:           platform,
        design_notes:       designNotes,
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'project_id' })

  } else if (projectCategory === 'PHYSICAL') {
    const itemType          = (formData.get('itemType')          as string) || null
    const quantity          = parseInt(formData.get('quantity') as string) || 1
    const materialNotes     = (formData.get('materialNotes')     as string) || null
    const sizeNotes         = (formData.get('sizeNotes')         as string) || null
    const colorNotes        = (formData.get('colorNotes')        as string) || null
    const designFileUrl     = (formData.get('designFileUrl')     as string) || null
    const shippingAddress   = (formData.get('shippingAddress')   as string) || null
    const shippingCourier   = (formData.get('shippingCourier')   as string) || null
    const trackingNumber    = (formData.get('trackingNumber')    as string) || null
    const shippingStatus    = (formData.get('shippingStatus')    as string) || 'WAITING'
    const productionDeadline = (formData.get('productionDeadline') as string) || null

    await supabaseAdmin
      .from('project_physical_details')
      .upsert({
        project_id:          projectId,
        item_type:           itemType,
        quantity,
        material_notes:      materialNotes,
        size_notes:          sizeNotes,
        color_notes:         colorNotes,
        design_file_url:     designFileUrl,
        shipping_address:    shippingAddress,
        shipping_courier:    shippingCourier,
        tracking_number:     trackingNumber,
        shipping_status:     shippingStatus,
        production_deadline: productionDeadline || null,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'project_id' })
  }

  // 📧 Kirim notifikasi email jika proyek baru saja diselesaikan
  if (status === 'completed' && oldStatus !== 'completed' && existingProject) {
    const profile = existingProject.profiles as any
    const org = existingProject.organizations as any
    
    const clientEmail = profile?.email
    const clientName  = profile?.full_name || 'Klien'
    const projectName = existingProject.title
    const agencyName  = org?.name || 'Agensi'

    if (clientEmail) {
      sendProjectCompletedEmail({ clientEmail, clientName, projectName, agencyName })
        .catch(err => console.error('Background email task failed:', err))
    }
  }

  // 📝 Catat aksi
  const { user } = await getAuthenticatedUser()
  if (user) {
    await logAudit({
      organizationId: orgId,
      actorId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.PROJECT_UPDATE,
      targetType: 'project',
      targetId: projectId,
      targetName: existingProject?.title || 'Proyek',
      metadata: { total_price: totalPrice, project_category: projectCategory },
    })
  }

  const { recalculateProjectPaymentStatus } = require('./pos/actions')
  await recalculateProjectPaymentStatus(projectId, orgId)

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/project/${projectId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateProjectUpdatePrice (Biaya Tambahan)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProjectUpdatePrice(projectId: string, updatePrice: number) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      update_price: updatePrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (error) return { error: 'Gagal menyimpan biaya tambahan.' }

  revalidatePath(`/dashboard/project/${projectId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// requestInvoice — Ops/Admin minta staf keuangan buatkan invoice untuk termin tertentu
// ─────────────────────────────────────────────────────────────────────────────

export async function requestInvoice(projectId: string, terminLabel: string) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // Ambil invoice_requests saat ini
  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('invoice_requests, title')
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !project) return { error: 'Proyek tidak ditemukan.' }

  const currentRequests: string[] = (project.invoice_requests as string[]) || []
  if (currentRequests.includes(terminLabel)) {
    return { error: `Request untuk ${terminLabel} sudah ada dalam antrean.` }
  }

  const updatedRequests = [...currentRequests, terminLabel]

  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({ invoice_requests: updatedRequests, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (updateError) return { error: 'Gagal mengirim request invoice.' }

  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: AUDIT_ACTIONS.PROJECT_UPDATE,
    targetType: 'project',
    targetId: projectId,
    targetName: project.title || 'Proyek',
    metadata: { action: 'request_invoice', termin: terminLabel },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/project/${projectId}`)
  revalidatePath('/dashboard/pos')
  return { success: true }
}


// ─────────────────────────────────────────────────────────────────────────────
// updateRevisionStatus
// ─────────────────────────────────────────────────────────────────────────────

export async function updateRevisionStatus(revisionId: string, status: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: join ke projects untuk verifikasi org
  //    Kita tidak bisa filter revision langsung by org,
  //    jadi kita cek dulu apakah revision ini ada di project milik org kita
  const { data: revision } = await supabaseAdmin
    .from('project_revisions')
    .select('id, projects!inner(organization_id)')
    .eq('id', revisionId)
    .eq('projects.organization_id', orgId)
    .single()

  if (!revision) {
    return { error: 'Revisi tidak ditemukan atau bukan milik organisasi Anda.' }
  }

  const { error } = await supabaseAdmin
    .from('project_revisions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', revisionId)

  if (error) return { error: 'Gagal update status revisi.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// replyToRevision
// ─────────────────────────────────────────────────────────────────────────────

export async function replyToRevision(formData: FormData) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const revisionId = formData.get('revisionId') as string
  const adminReply = formData.get('adminReply')  as string
  const projectId  = formData.get('projectId')   as string

  if (!revisionId || !adminReply || !projectId) {
    return { error: 'Data tidak lengkap.' }
  }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: verifikasi revision ada di project milik org kita
  const { data: revision } = await supabaseAdmin
    .from('project_revisions')
    .select('id, projects!inner(organization_id)')
    .eq('id', revisionId)
    .eq('projects.organization_id', orgId)
    .single()

  if (!revision) {
    return { error: 'Revisi tidak ditemukan atau bukan milik organisasi Anda.' }
  }

  const { error } = await supabaseAdmin
    .from('project_revisions')
    .update({ 
      admin_reply: adminReply, 
      status: 'Completed', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', revisionId)

  if (error) return { error: 'Gagal mengirim balasan.' }

  // 📝 Catat aksi: admin balas revisi
  const { user } = await getAuthenticatedUser()
  if (user) {
    await logAudit({
      organizationId: orgId,
      actorId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.REVISION_REPLY,
      targetType: 'revision',
      targetId: revisionId,
      metadata: { auto_completed: true },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/project/${projectId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateDomainInfo
// ─────────────────────────────────────────────────────────────────────────────

export async function updateDomainInfo(projectId: string, formData: FormData) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const domainName = formData.get('domainName')?.toString() || null
  const domainExpiryDate = formData.get('domainExpiryDate')?.toString() || null
  const hostingInfo = formData.get('hostingInfo')?.toString() || null
  const warrantyMonths = parseInt(formData.get('warrantyMonths')?.toString() || '0')
  const warrantyExpiredAt = formData.get('warrantyExpiredAt')?.toString() || null

  const { error } = await supabase
    .from('projects')
    .update({
      domain_name: domainName,
      domain_expiry_date: domainExpiryDate ? new Date(domainExpiryDate).toISOString() : null,
      hosting_info: hostingInfo,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (error) {
    console.error('Error updating domain info:', error)
    throw new Error('Failed to update domain info')
  }

  // Juga update garansi di project_digital_details (jika ada)
  const { error: digitalError } = await supabase
    .from('project_digital_details')
    .update({
      warranty_months: warrantyMonths,
      warranty_expired_at: warrantyExpiredAt ? new Date(warrantyExpiredAt).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  if (digitalError) {
    console.error('Error updating warranty info:', digitalError)
    // We don't throw here to avoid failing the whole request if the digital detail doesn't exist yet, 
    // although ideally it should exist for a digital project.
  }

  revalidatePath('/dashboard/infrastructure')
  revalidatePath(`/dashboard/project/${projectId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteProjectAsset
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProjectAsset(assetId: string, fileUrl: string, projectId: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: verifikasi asset ada di project milik org kita
  const { data: asset } = await supabaseAdmin
    .from('project_assets')
    .select('id, projects!inner(organization_id)')
    .eq('id', assetId)
    .eq('projects.organization_id', orgId)
    .single()

  if (!asset) {
    return { error: 'Asset tidak ditemukan atau bukan milik organisasi Anda.' }
  }

  // Hapus dari Supabase Storage (cek semua kemungkinan bucket)
  try {
    if (fileUrl.includes('/assets/')) {
      const parts = fileUrl.split('/assets/')
      if (parts[1]) await supabaseAdmin.storage.from('assets').remove([parts[1]])
    } else if (fileUrl.includes('/client-assets/')) {
      const parts = fileUrl.split('/client-assets/')
      if (parts[1]) await supabaseAdmin.storage.from('client-assets').remove([parts[1]])
    } else if (fileUrl.includes('/design_assets/')) {
      const parts = fileUrl.split('/design_assets/')
      if (parts[1]) await supabaseAdmin.storage.from('design_assets').remove([parts[1]])
    }
  } catch (storageErr) {
    console.error('Failed to remove physical file from storage:', storageErr)
  }

  // Hapus dari database
  const { error } = await supabaseAdmin
    .from('project_assets')
    .delete()
    .eq('id', assetId)

  if (error) return { error: 'Gagal menghapus asset.' }

  // 📝 Catat aksi: hapus asset
  const { user } = await getAuthenticatedUser()
  if (user) {
    await logAudit({
      organizationId: orgId,
      actorId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.ASSET_DELETE,
      targetType: 'asset',
      targetId: assetId,
      metadata: { file_url: fileUrl },
    })
  }

  revalidatePath(`/dashboard/project/${projectId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agency Services
// ─────────────────────────────────────────────────────────────────────────────

export async function addAgencyService(organizationId: string, name: string, serviceCategory: string = 'DIGITAL') {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  // 🔒 Abaikan organizationId dari parameter, selalu pakai dari session
  if (!name?.trim()) return { error: 'Nama layanan wajib diisi.' }
  
  const validCategories = ['DIGITAL', 'PHYSICAL']
  const safeCategory = validCategories.includes(serviceCategory) ? serviceCategory : 'DIGITAL'

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('agency_services')
    .insert({ organization_id: orgId, name: name.trim(), service_category: safeCategory })

  if (error) return { error: 'Gagal menambah layanan.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}


export async function editAgencyService(serviceId: string, newName: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  if (!newName?.trim() || !serviceId) return { error: 'Nama layanan tidak valid.' }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: filter by organization_id
  const { error } = await supabaseAdmin
    .from('agency_services')
    .update({ name: newName.trim() })
    .eq('id', serviceId)
    .eq('organization_id', orgId) // ← Admin hanya bisa edit service milik org-nya

  if (error) return { error: 'Gagal mengubah layanan.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteAgencyService(serviceId: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  if (!serviceId) return { error: 'ID layanan tidak valid.' }

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: filter by organization_id
  const { error } = await supabaseAdmin
    .from('agency_services')
    .delete()
    .eq('id', serviceId)
    .eq('organization_id', orgId) // ← Admin hanya bisa hapus service milik org-nya

  if (error) return { error: 'Gagal menghapus layanan.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
 
  
  
// ─────────────────────────────────────────────────────────────────────────────
// updateClientAccount
// ─────────────────────────────────────────────────────────────────────────────

export async function updateClientAccount(clientId: string, formData: FormData) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const whatsappNumber = (formData.get('whatsapp_number') as string)?.trim() || null
  const password       = (formData.get('password') as string)

  const supabaseAdmin = createAdminClient()

  // 🔒 IDOR Prevention: check if client belongs to org
  const { data: client } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', clientId)
    .eq('organization_id', orgId)
    .single()

  if (!client) {
    return { error: 'Klien tidak ditemukan atau bukan milik organisasi Anda.' }
  }

  // Update profile for whatsapp number
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ whatsapp_number: whatsappNumber })
    .eq('id', clientId)

  if (profileError) return { error: 'Gagal update profil klien.' }

  // Update password if provided
  if (password && password.length >= 6) {
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(clientId, {
      password
    })
    if (pwError) return { error: 'Gagal update password klien.' }
  }

  // 📝 Catat aksi: update klien
  const { user } = await getAuthenticatedUser()
  if (user) {
    await logAudit({
      organizationId: orgId,
      actorId: user.id,
      actorEmail: user.email,
      action: AUDIT_ACTIONS.CLIENT_UPDATE,
      targetType: 'client',
      targetId: clientId,
      metadata: { updated_whatsapp: !!whatsappNumber, updated_password: !!password },
    })
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function createRevision(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const projectId = formData.get('projectId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  const { data: project } = await supabase.from('projects').select('status').eq('id', projectId).single()

  const { error } = await supabase.from('project_revisions').insert({
    project_id: projectId,
    title,
    description,
    status: 'Pending'
  })

  if (error) {
    console.error(error)
    return { error: 'Failed to create revision' }
  }

  if (project?.status === 'completed' || project?.status === 'maintenance' || project?.status?.startsWith('update_')) {
    const supabaseAdmin = createAdminClient()
    const { error: statusError } = await supabaseAdmin.from('projects').update({
      status: 'update_pengajuan',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)
    if (statusError) {
      console.error('Error updating project status:', statusError)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/updates')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/project/${projectId}`)
  return { success: true }
}

export async function uploadAssetToSupabase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file || !projectId) {
    return { error: 'File atau Project ID tidak valid.' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `projects/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, new Uint8Array(fileBuffer), {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading to storage:', uploadError)
    return { error: 'Gagal mengupload file ke server.' }
  }

  const { data: urlData } = supabase.storage
    .from('assets')
    .getPublicUrl(fileName)

  const fileUrl = urlData.publicUrl

  const { error } = await supabase.from('project_assets').insert({
    project_id: projectId,
    file_name: file.name,
    file_url: fileUrl
  })

  if (error) {
    console.error(error)
    return { error: 'Gagal menyimpan data aset.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/project/${projectId}`)
  return { success: true }
}

export async function createProjectInvoice({ projectId, clientId, title, amount, dueDate, includeTax }: { projectId: string, clientId: string, title: string, amount: number, dueDate: string, includeTax: boolean }) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()
  
  const taxAmount = includeTax ? Math.round(amount * 0.12) : 0
  const finalAmount = amount + taxAmount

  const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const invoiceNumber = `INV-${dateStr}`

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('fin_invoices')
    .insert({
      organization_id: orgId,
      project_id: projectId,
      client_id: clientId,
      title,
      amount: finalAmount,
      due_date: dueDate,
      invoice_number: invoiceNumber,
      status: 'PENDING'
    })
    .select()
    .single()

  if (invoiceError) {
    console.error('Invoice creation error:', invoiceError)
    return { error: `Gagal membuat tagihan: ${invoiceError.message}` }
  }

  const items = [{
    invoice_id: invoice.id,
    item_name: title,
    price: amount,
    quantity: 1
  }]

  if (includeTax && taxAmount > 0) {
    items.push({
      invoice_id: invoice.id,
      item_name: 'PPN 12%',
      price: taxAmount,
      quantity: 1
    })
  }

  await supabaseAdmin.from('fin_invoice_items').insert(items)

  await logAudit({
    organizationId: orgId,
    actorId: user.id,
    actorEmail: user.email,
    action: AUDIT_ACTIONS.PROJECT_UPDATE,
    targetType: 'project',
    targetId: projectId,
    targetName: title,
    metadata: { action: 'create_schedule', amount: finalAmount, due_date: dueDate },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/project/${projectId}`)
  revalidatePath('/dashboard/pos')
  return { success: true }
}

export async function deleteProjectInvoice(invoiceId: string) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  const { data: invoice } = await supabaseAdmin.from('fin_invoices').select('project_id, status').eq('id', invoiceId).eq('organization_id', orgId).single()
  if (!invoice) return { error: 'Tagihan tidak ditemukan' }
  if (invoice.status === 'PAID') return { error: 'Tagihan yang sudah dibayar tidak bisa dibatalkan' }

  const { error } = await supabaseAdmin.from('fin_invoices').update({ status: 'CANCELLED' }).eq('id', invoiceId).eq('organization_id', orgId)
  if (error) return { error: 'Gagal membatalkan tagihan' }

  revalidatePath('/dashboard')
  if (invoice.project_id) revalidatePath(`/dashboard/project/${invoice.project_id}`)
  revalidatePath('/dashboard/pos')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fitur Pecah Cicilan (Approval oleh Kasir)
// ─────────────────────────────────────────────────────────────────────────────

export async function approveInvoiceSplit(invoiceId: string) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }

  const supabaseAdmin = createAdminClient()

  const { data: invoice, error: fetchError } = await supabaseAdmin
    .from('fin_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice tidak ditemukan.' }
  if (invoice.status !== 'SPLIT_REQUESTED') return { error: 'Status tidak valid.' }

  const details = invoice.split_request_details as any || {}
  const splitCount = details.split_count || 2
  const amountPerSplit = Math.ceil(invoice.amount / splitCount)
  const gapDays = invoice.amount < 10000000 ? 14 : 30

  // Bikin invoice anak
  const newInvoices = Array.from({ length: splitCount }).map((_, i) => {
    const isLast = i === splitCount - 1
    const amount = isLast ? invoice.amount - (amountPerSplit * (splitCount - 1)) : amountPerSplit
    
    const d = invoice.due_date ? new Date(invoice.due_date) : new Date()
    d.setDate(d.getDate() + (i * gapDays))

    return {
      organization_id: invoice.organization_id,
      client_id: invoice.client_id,
      project_id: invoice.project_id,
      termin_label: invoice.termin_label,
      title: `[Cicilan ${i + 1}/${splitCount}] ${invoice.title}`,
      amount: amount,
      invoice_number: `${invoice.invoice_number}-C${i + 1}`,
      status: 'PENDING',
      due_date: d.toISOString(),
      parent_invoice_id: invoice.id
    }
  })

  // Insert children
  const { error: insertError } = await supabaseAdmin.from('fin_invoices').insert(newInvoices)
  if (insertError) return { error: 'Gagal membuat invoice anak.' }

  // Update parent
  const { error: updateError } = await supabaseAdmin
    .from('fin_invoices')
    .update({ status: 'SPLIT_APPROVED' })
    .eq('id', invoiceId)

  if (updateError) return { error: 'Gagal memperbarui status induk.' }

  revalidatePath('/dashboard/pos')
  return { success: true }
}

export async function rejectInvoiceSplit(invoiceId: string, reason: string) {
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) return { error: authError }
  if (!reason.trim()) return { error: 'Alasan penolakan wajib diisi.' }

  const supabaseAdmin = createAdminClient()

  const { data: invoice, error: fetchError } = await supabaseAdmin
    .from('fin_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice tidak ditemukan.' }

  const details = invoice.split_request_details as any || {}
  details.pos_rejection_reason = reason.trim()

  const { error: updateError } = await supabaseAdmin
    .from('fin_invoices')
    .update({ 
      status: 'PENDING', 
      split_request_details: details 
    })
    .eq('id', invoiceId)

  if (updateError) return { error: 'Gagal menolak cicilan.' }

  revalidatePath('/dashboard/pos')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL CLIENT FLOW ACTIONS
// Aksi yang dipanggil dari portal klien untuk proyek fisik
// ─────────────────────────────────────────────────────────────────────────────

/**
 * accPhysicalDesign — Klien ACC mockup desain, pesanan masuk antrean produksi
 */
export async function accPhysicalDesign(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // Pastikan proyek ini milik klien yang sedang login
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status, organization_id, title')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }
  if (project.status !== 'design' && project.status !== 'revision') {
    return { error: 'Desain belum siap untuk di-ACC.' }
  }

  // Update status ke production (masuk antrean mesin)
  const { error: updateErr } = await supabaseAdmin
    .from('projects')
    .update({ status: 'production', progress_percentage: 50 })
    .eq('id', projectId)

  if (updateErr) return { error: 'Gagal meng-ACC desain.' }

  // Catat internal note sebagai log
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: '[ACC DARI KLIEN] Klien telah menyetujui desain. Pesanan masuk antrean produksi.',
    visible_to_client: true,
    is_client_message: true,
  })

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * requestPhysicalRevision — Klien minta revisi desain dengan keterangan
 */
export async function requestPhysicalRevision(projectId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!message.trim()) return { error: 'Keterangan revisi wajib diisi.' }

  const supabaseAdmin = createAdminClient()

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status, organization_id, title')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }
  if (project.status !== 'design' && project.status !== 'revision') {
    return { error: 'Tidak dapat mengajukan revisi pada tahap ini.' }
  }

  // Update status ke revision_pending
  const { error: updateErr } = await supabaseAdmin
    .from('projects')
    .update({ status: 'revision_pending' })
    .eq('id', projectId)

  if (updateErr) return { error: 'Gagal mengajukan revisi.' }

  // Buat entri revisi
  await supabaseAdmin.from('project_revisions').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    title: 'Revisi Desain dari Klien',
    description: message.trim(),
    status: 'Pending',
  })

  // Catat internal note
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: `[REVISI DARI KLIEN] ${message.trim()}`,
    visible_to_client: true,
    is_client_message: true,
  })

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * confirmPhysicalDelivery — Klien konfirmasi barang sudah diterima
 */
export async function confirmPhysicalDelivery(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status, organization_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }
  if (project.status !== 'shipped') return { error: 'Pesanan belum dalam status pengiriman.' }

  // Update status ke completed + update shipping_status di physical_details
  const { error: updateErr } = await supabaseAdmin
    .from('projects')
    .update({ status: 'completed', progress_percentage: 100 })
    .eq('id', projectId)

  if (updateErr) return { error: 'Gagal konfirmasi penerimaan.' }

  await supabaseAdmin
    .from('project_physical_details')
    .update({ shipping_status: 'DELIVERED' })
    .eq('project_id', projectId)

  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: '[KONFIRMASI KLIEN] Klien mengonfirmasi bahwa pesanan telah diterima.',
    visible_to_client: true,
    is_client_message: true,
  })

  revalidatePath('/dashboard')
  return { success: true }
}