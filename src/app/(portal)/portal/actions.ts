'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Ambil dan validasi klien yang sedang login
// ─────────────────────────────────────────────────────────────────────────────
async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: 'Sesi tidak valid.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    return { user: null, error: 'Akses ditolak.' }
  }

  return { user, orgId: profile.organization_id, error: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// confirmPayment — Upload bukti bayar, ubah status invoice
// ─────────────────────────────────────────────────────────────────────────────
export async function confirmPayment(invoiceId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan invoice milik klien yang sedang login
  const { data: invoice } = await supabaseAdmin
    .from('fin_invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('client_id', user.id)
    .single()

  if (!invoice) return { error: 'Invoice tidak ditemukan.' }

  const file = formData.get('payment_proof') as File

  let paymentProofUrl: string | null = null

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `payment-proofs/${invoiceId}-${Date.now()}.${fileExt}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('assets')
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage.from('assets').getPublicUrl(fileName)
      paymentProofUrl = urlData?.publicUrl || null
    }
  }

  const { error } = await supabaseAdmin
    .from('fin_invoices')
    .update({
      status: 'WAITING_CONFIRMATION',
      payment_proof_url: paymentProofUrl,
    })
    .eq('id', invoiceId)
    .eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// requestInvoiceSplit — Klien ajukan cicilan pada termin tertentu
// ─────────────────────────────────────────────────────────────────────────────
export async function requestInvoiceSplit(invoiceId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan invoice milik klien yang sedang login
  const { data: invoice } = await supabaseAdmin
    .from('fin_invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('client_id', user.id)
    .single()

  if (!invoice) return { error: 'Invoice tidak ditemukan.' }

  const jumlahCicilan = formData.get('jumlah_cicilan') as string
  const alasan = formData.get('alasan') as string

  const { error } = await supabaseAdmin
    .from('fin_invoices')
    .update({
      status: 'SPLIT_REQUESTED',
      split_request_details: JSON.stringify({
        jumlah_cicilan: jumlahCicilan,
        alasan: alasan,
        requested_at: new Date().toISOString(),
        requested_by: user.id,
      }),
    })
    .eq('id', invoiceId)
    .eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/portal')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// submitClientRevision — Klien kirim catatan revisi desain
// ─────────────────────────────────────────────────────────────────────────────
export async function submitClientRevision(projectId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const content = formData.get('revision_notes') as string
  if (!content?.trim()) return { error: 'Catatan revisi tidak boleh kosong.' }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  const { error } = await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: `[REVISI DARI KLIEN] ${content}`,
    is_client_message: true,
    visible_to_client: true,
  })

  if (error) return { error: error.message }

  // Update project revision status to revision_pending
  await supabaseAdmin
    .from('projects')
    .update({ status: 'revision_pending' })
    .eq('id', projectId)
    .eq('client_id', user.id)

  revalidatePath(`/portal/project/${projectId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// createDigitalRevision — Klien ajukan revisi/update digital ke project_revisions
// ─────────────────────────────────────────────────────────────────────────────
export async function createDigitalRevision(projectId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()

  if (!title || !description) {
    return { error: 'Judul dan rincian revisi/update wajib diisi.' }
  }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  const { error } = await supabaseAdmin.from('project_revisions').insert({
    project_id: projectId,
    title,
    description,
    status: 'Pending',
  })

  if (error) return { error: error.message }

  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/dashboard/revisions')
  revalidatePath('/dashboard/updates')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// approveDesign — Klien ACC desain
// ─────────────────────────────────────────────────────────────────────────────
export async function approveDesign(projectId: string) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  // Catat sebagai note
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: '[ACC DARI KLIEN] Klien menyetujui desain. Siap masuk ke tahap produksi.',
    is_client_message: true,
    visible_to_client: true,
  })

  // Update status ke approved / siap produksi
  await supabaseAdmin
    .from('projects')
    .update({ status: 'production' })
    .eq('id', projectId)
    .eq('client_id', user.id)

  revalidatePath(`/portal/project/${projectId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// clientConfirmDelivery — Klien konfirmasi barang telah sampai/diterima (Selesai)
// ─────────────────────────────────────────────────────────────────────────────
export async function clientConfirmDelivery(projectId: string) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  // 1. Update project to completed 100%
  const { error: projErr } = await supabaseAdmin
    .from('projects')
    .update({
      status: 'completed',
      progress_percentage: 100,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('client_id', user.id)

  if (projErr) return { error: projErr.message }

  // 2. Update physical detail shipping_status
  await supabaseAdmin
    .from('project_physical_details')
    .update({
      shipping_status: 'DELIVERED',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  // 3. Insert note
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: '[KONFIRMASI KLIEN] Pesanan telah DITERIMA dengan baik oleh klien. Proyek SELESAI.',
    is_client_message: true,
    visible_to_client: true
  })

  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/shipping/history')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/completed')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// clientReportDefect — Klien lapor barang cacat / rusak / pengajuan retur
// ─────────────────────────────────────────────────────────────────────────────
export async function clientReportDefect(projectId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const complaintType = formData.get('complaint_type') as string || 'Cacat Cetak / Rusak'
  const description = formData.get('defect_description') as string
  const videoUrl = formData.get('video_unboxing_url') as string
  const solutionPreference = formData.get('solution_preference') as string || 'reship' // 'reship' or 'refund'

  if (!description?.trim()) return { error: 'Rincian kendala/cacat cetak wajib diisi.' }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('organization_id, title')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  const file = formData.get('defect_photo') as File | null
  let photoUrl = ''

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `defects/${projectId}/${Date.now()}.${fileExt}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('design_assets')
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true })

    if (!uploadErr) {
      const { data: urlData } = supabaseAdmin.storage.from('design_assets').getPublicUrl(fileName)
      photoUrl = urlData?.publicUrl || ''
    }
  }

  const solutionText = solutionPreference === 'refund' ? '💰 Minta Pembatalan & Refund Dana' : '🔄 Minta Cetak Ulang & Kirim Pengganti (Retur)'
  
  let noteContent = `[KLAIM RETUR & KOMPLAIN]\nJenis Masalah: ${complaintType}\nSolusi yang Diminta: ${solutionText}\nRincian Kendala: ${description.trim()}`
  if (videoUrl?.trim()) noteContent += `\nLink Video Unboxing: ${videoUrl.trim()}`
  if (photoUrl) noteContent += `\nFoto Bukti: ${photoUrl}`

  // 1. Insert note
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: project.organization_id,
    author_id: user.id,
    content: noteContent,
    is_client_message: true,
    visible_to_client: true
  })

  // 2. Update shipping_status to RETURN_REQUESTED
  await supabaseAdmin
    .from('project_physical_details')
    .update({ 
      shipping_status: 'RETURN_REQUESTED',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  // 3. Set project status to revision_pending for CS/Production/Shipping review
  await supabaseAdmin
    .from('projects')
    .update({ 
      status: 'revision_pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('client_id', user.id)

  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  revalidatePath('/dashboard/shipping/confirmation')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/messages')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// uploadClientAsset — Klien upload file aset/brief
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadClientAsset(projectId: string, formData: FormData) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const file = formData.get('asset_file') as File
  const assetUrl = formData.get('asset_url') as string
  const assetName = formData.get('asset_name') as string
  const assetCategory = formData.get('asset_category') as string
  const assetNotes = formData.get('asset_notes') as string

  const hasFile = file && file.size > 0
  const hasUrl = assetUrl && assetUrl.trim() !== ''

  if (!hasFile && !hasUrl) return { error: 'Pilih file atau masukkan link URL terlebih dahulu.' }

  const supabaseAdmin = createAdminClient()

  // 🔒 Pastikan proyek milik klien ini
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('organization_id, title')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  if (!project) return { error: 'Proyek tidak ditemukan.' }

  const clientProfile = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const uploaderName = clientProfile.data?.full_name || 'Klien'

  // ── Case 1: Upload FILE ke storage ──
  if (hasFile) {
    const fileExt = file.name.split('.').pop()
    const fileName = `client-assets/${projectId}/${Date.now()}-${assetName || file.name}.${fileExt}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('design_assets')
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage.from('design_assets').getPublicUrl(fileName)
      const fileUrl = urlData?.publicUrl || ''
      const fileName2 = assetName || file.name
      const labelFile = assetNotes ? `[${project.title}] ${fileName2} — ${assetNotes}` : `[${project.title}] ${fileName2}`

      await supabaseAdmin.from('project_assets').insert({
        project_id: projectId, file_name: fileName2, file_url: fileUrl,
        asset_category: assetCategory || 'Lainnya', asset_notes: assetNotes || null,
      })
      await supabaseAdmin.from('design_assets').insert({
        organization_id: project.organization_id, name: labelFile,
        category: assetCategory || 'Lainnya', url: fileUrl,
        uploader_id: user.id, uploader_name: uploaderName,
        size_mb: file.size / (1024 * 1024),
      })
    }
  }

  // ── Case 2: Simpan URL eksternal ──
  if (hasUrl) {
    const urlFileName = assetName || 'Tautan Eksternal'
    const labelUrl = assetNotes ? `[${project.title}] ${urlFileName} — ${assetNotes}` : `[${project.title}] ${urlFileName}`

    const { error: paError } = await supabaseAdmin.from('project_assets').insert({
      project_id: projectId, file_name: urlFileName, file_url: assetUrl.trim(),
      asset_category: assetCategory || 'Lainnya', asset_notes: assetNotes || null,
    })
    if (paError) return { error: 'Gagal simpan URL: ' + paError.message }

    await supabaseAdmin.from('design_assets').insert({
      organization_id: project.organization_id, name: labelUrl,
      category: assetCategory || 'Lainnya', url: assetUrl.trim(),
      uploader_id: user.id, uploader_name: uploaderName, size_mb: 0,
    })
  }

  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/dashboard/design/assets')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// payInvoiceWithGatewaySandbox — Simulasi pembayaran instan via QRIS / VA Sandbox
// ─────────────────────────────────────────────────────────────────────────────
export async function payInvoiceWithGatewaySandbox(invoiceId: string, paymentMethod: string) {
  const { user, error: authError } = await getAuthenticatedClient()
  if (authError || !user) return { error: authError }

  const supabaseAdmin = createAdminClient()

  // 1. Fetch invoice details
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from('fin_invoices')
    .select('id, organization_id, client_id, project_id, invoice_number, title, amount, status, organizations(name, whatsapp_number), profiles:client_id(full_name, whatsapp_number)')
    .eq('id', invoiceId)
    .eq('client_id', user.id)
    .single()

  if (invErr || !invoice) {
    return { error: 'Invoice tidak ditemukan atau bukan milik akun Anda.' }
  }

  // 2. Update invoice status to PAID
  const { error: updErr } = await supabaseAdmin
    .from('fin_invoices')
    .update({
      status: 'PAID',
    })
    .eq('id', invoiceId)

  if (updErr) {
    return { error: 'Gagal memperbarui status invoice: ' + updErr.message }
  }

  // 3. Update project payment status if project exists
  if (invoice.project_id) {
    await supabaseAdmin
      .from('projects')
      .update({ payment_status: 'paid' })
      .eq('id', invoice.project_id)
  }

  // 4. Record income transaction in ledger
  await supabaseAdmin
    .from('fin_transactions')
    .insert({
      organization_id: invoice.organization_id,
      type: 'INCOME',
      amount: invoice.amount,
      description: `Pembayaran Online (${paymentMethod}) — Faktur ${invoice.invoice_number}`,
      reference_id: invoice.id,
      reference_type: 'INVOICE',
    })

  revalidatePath('/portal')
  revalidatePath(`/portal/invoice/${invoiceId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard/pos')

  return { 
    success: true, 
    invoiceNumber: invoice.invoice_number,
    amount: invoice.amount,
    orgName: (invoice.organizations as any)?.name || 'Agensi',
  }
}
