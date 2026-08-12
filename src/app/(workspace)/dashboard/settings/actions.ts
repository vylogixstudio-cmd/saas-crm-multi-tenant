'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { updatePasswordSchema } from '@/utils/validations'
import { getAuthenticatedUser } from '../actions'

// ============================================================
// CARD 1: Organization Profile & Branding
// ============================================================

export async function updateOrganizationSettings(formData: FormData) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid. Silakan login kembali.' }
  }

  const supabase = createAdminClient()

  // 1. Fetch organization ID from the admin's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Organisasi tidak ditemukan. Coba refresh halaman.' }
  }

  const orgId = profile.organization_id

  const name = (formData.get('name') as string | null)?.trim()
  const tagline = (formData.get('tagline') as string | null)?.trim()
  const whatsapp_number = (formData.get('whatsapp_number') as string | null)?.trim() || null
  const log_retention_days = parseInt(formData.get('log_retention_days') as string) || 30
  const bank_name = (formData.get('bank_name') as string | null)?.trim() || null
  const bank_account_number = (formData.get('bank_account_number') as string | null)?.trim() || null
  const bank_account_name = (formData.get('bank_account_name') as string | null)?.trim() || null
  const company_address = (formData.get('company_address') as string | null)?.trim() || null
  const company_email = (formData.get('company_email') as string | null)?.trim() || null
  const monthly_sales_target = parseFloat(formData.get('monthlySalesTarget') as string) || 0
  const logoFile = formData.get('logo') as File | null
  const qrisFile = formData.get('qris') as File | null

  if (!name) {
    return { error: 'Nama agensi tidak boleh kosong.' }
  }

  // ── Bagian 1: Update teks (name & tagline) — SELALU dijalankan ─────────────
  const textPayload: Record<string, string | number | null> = { 
    name, 
    whatsapp_number, 
    log_retention_days,
    bank_name,
    bank_account_number,
    bank_account_name,
    company_address,
    company_email,
    monthly_sales_target
  }
  // tagline is always included (empty string is valid — clears the field)
  textPayload.tagline = tagline ?? 'Bridging Design and Code'

  const { error: textDbError } = await supabase
    .from('organizations')
    .update(textPayload)
    .eq('id', orgId)

  if (textDbError) {
    return { error: `Gagal menyimpan nama/tagline: ${textDbError.message}` }
  }

  // ── Bagian 2: Upload logo — OPSIONAL, tidak memblokir jika gagal ───────────
  let logoWarning: string | null = null

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 500 * 1024) {
      return { error: 'Ukuran logo maksimal 500KB.' }
    }
    
    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `logos/org-${orgId}-${Date.now()}.${fileExt}`
      const arrayBuffer = await logoFile.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, fileBuffer, {
          contentType: logoFile.type,
          upsert: true,
        })

      if (uploadError) {
        // Log the specific error but do NOT block the text update that already succeeded
        console.error('[Settings] Logo upload error:', uploadError.message)
        logoWarning = `Nama & tagline berhasil disimpan, namun logo gagal diupload: ${uploadError.message}. Pastikan bucket "assets" sudah dibuat di Supabase Storage.`
      } else {
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName)

        // Save logo_url in a separate update so text is never at risk
        const { error: logoDbError } = await supabase
          .from('organizations')
          .update({ logo_url: urlData.publicUrl })
          .eq('id', orgId)

        if (logoDbError) {
          console.error('[Settings] Logo URL save error:', logoDbError.message)
          logoWarning = `Logo berhasil diupload, namun URL-nya gagal disimpan ke database: ${logoDbError.message}`
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Settings] Unexpected logo error:', message)
      logoWarning = `Nama & tagline berhasil disimpan, namun terjadi error saat memproses logo: ${message}`
    }
  }

  // ── Bagian 3: Upload QRIS — OPSIONAL, tidak memblokir jika gagal ───────────
  let qrisWarning: string | null = null

  if (qrisFile && qrisFile.size > 0) {
    if (qrisFile.size > 1024 * 1024) {
      return { error: 'Ukuran gambar QRIS maksimal 1MB.' }
    }
    
    try {
      const fileExt = qrisFile.name.split('.').pop()
      const fileName = `qris/org-${orgId}-${Date.now()}.${fileExt}`
      const arrayBuffer = await qrisFile.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, fileBuffer, {
          contentType: qrisFile.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('[Settings] QRIS upload error:', uploadError.message)
        qrisWarning = `QRIS gagal diupload: ${uploadError.message}.`
      } else {
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName)

        const { error: qrisDbError } = await supabase
          .from('organizations')
          .update({ qris_image_url: urlData.publicUrl })
          .eq('id', orgId)

        if (qrisDbError) {
          console.error('[Settings] QRIS URL save error:', qrisDbError.message)
          qrisWarning = `QRIS diupload, namun URL-nya gagal disimpan: ${qrisDbError.message}`
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Settings] Unexpected QRIS error:', message)
      qrisWarning = `Terjadi error saat memproses QRIS: ${message}`
    }
  }

  // ── Revalidate cache so Sidebar/Header/Dashboard sync immediately ───────────
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  // Return success with an optional warning if logo had issues
  const warnings = [logoWarning, qrisWarning].filter(Boolean).join(' | ')
  if (warnings) {
    return { success: true, warning: warnings }
  }
  return { success: true }
}

// ============================================================
// CARD 2: Agency Services CRUD
// ============================================================

export async function addAgencyService(name: string, serviceClass: string = 'digital_umum') {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabase = createAdminClient()

  if (!name?.trim()) {
    return { error: 'Nama layanan wajib diisi.' }
  }

  const validClasses = ['website', 'digital_umum', 'fisik']
  const safeClass = validClasses.includes(serviceClass) ? serviceClass : 'digital_umum'

  const { error } = await supabase
    .from('agency_services')
    .insert([{ organization_id: orgId, name: name.trim(), service_class: safeClass, service_category: safeClass === 'fisik' ? 'PHYSICAL' : 'DIGITAL' }])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateAgencyService(serviceId: string, newName: string, serviceClass?: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabase = createAdminClient()

  if (!newName?.trim() || !serviceId) {
    return { error: 'Nama layanan tidak valid.' }
  }

  const updatePayload: any = { name: newName.trim() }
  if (serviceClass) {
    const validClasses = ['website', 'digital_umum', 'fisik']
    if (validClasses.includes(serviceClass)) {
      updatePayload.service_class = serviceClass
      updatePayload.service_category = serviceClass === 'fisik' ? 'PHYSICAL' : 'DIGITAL'
    }
  }

  const { error } = await supabase
    .from('agency_services')
    .update(updatePayload)
    .eq('id', serviceId)
    .eq('organization_id', orgId) // <-- Anti-IDOR

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteAgencyService(serviceId: string) {
  const { orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !orgId) return { error: authError }

  const supabase = createAdminClient()

  if (!serviceId) {
    return { error: 'ID layanan tidak valid.' }
  }

  const { error } = await supabase
    .from('agency_services')
    .delete()
    .eq('id', serviceId)
    .eq('organization_id', orgId) // <-- Anti-IDOR

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ============================================================
// CARD 3: Keamanan — Ubah Password
// ============================================================

export async function updatePassword(newPassword: string) {
  // PENTING: Gunakan cookie-based session client (bukan admin client)
  // supaya updateUser berjalan atas nama user yang sedang login.
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid. Silakan login kembali.' }
  }

  const validation = updatePasswordSchema.safeParse({ password: newPassword })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error } = await supabase.auth.updateUser({ password: validation.data.password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ============================================================
// Custom Asset Categories per Organization
// ============================================================

export async function updateCustomAssetCategories(categories: string[]) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return { error: 'Sesi tidak valid.' }

  const supabase = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'Organisasi tidak ditemukan.' }

  const cleanCategories = categories.map(c => c.trim()).filter(Boolean)

  const { error } = await supabase
    .from('organizations')
    .update({ custom_asset_categories: cleanCategories })
    .eq('id', profile.organization_id)

  if (error) {
    if (error.message?.includes('custom_asset_categories') || (error as any).code === '42703') {
      return { 
        error: 'Kolom database belum aktif: Jalankan script di "supabase_schema_asset_categories.sql" pada Supabase SQL Editor Anda untuk mengaktifkan kustom kategori permanen.' 
      }
    }
    return { error: error.message }
  }
  revalidatePath('/dashboard/settings')
  revalidatePath('/portal')
  return { success: true }
}

