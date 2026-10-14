'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantContext } from '@/utils/tenant'
import { revalidatePath } from 'next/cache'

// ACTIONS UNTUK PROYEK DESAIN

export async function updateDesignProject(projectId: string, data: { design_file_url: string, design_notes: string, status: string }) {
  const { user, orgId, supabaseAdmin } = await getTenantContext()

  if (!user) return { error: 'Not authenticated' }
  if (!orgId) return { error: 'No organization' }

  // 1. Update project details (both physical and digital, whichever exists)
  await supabaseAdmin
    .from('project_physical_details')
    .update({ 
      design_file_url: data.design_file_url || null,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  await supabaseAdmin
    .from('project_digital_details')
    .update({ 
      design_file_url: data.design_file_url || null,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  // 2. Update projects table status
  const { error: err2 } = await supabaseAdmin
    .from('projects')
    .update({ 
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (err2) return { error: 'Gagal update status: ' + err2.message }

  // 3. Simpan catatan desainer sebagai internal note (jika ada)
  if (data.design_notes?.trim()) {
    await supabaseAdmin.from('internal_notes').insert({
      project_id: projectId,
      organization_id: orgId,
      author_id: user.id,
      content: `[Catatan Desainer] ${data.design_notes.trim()}`,
      visible_to_client: true
    })
  }

  revalidatePath('/dashboard/design')
  revalidatePath('/dashboard/production')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function replyToDesignRevision(revisionId: string, reply: string) {
  const supabaseAdmin = createAdminClient()
  
  const { error } = await supabaseAdmin
    .from('project_revisions')
    .update({ 
      admin_reply: reply,
      status: 'Completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', revisionId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/design')
  return { success: true }
}

// ACTIONS UNTUK DESIGN ASSETS
export async function uploadAssetAndSave(formData: FormData) {
  const { user, profile, orgId, isSuperAdmin, supabaseAdmin } = await getTenantContext()
  if (!user) return { error: 'Not authenticated' }
  if (!orgId) return { error: 'No organization' }

  const supabase = await createClient()
  const db = (isSuperAdmin && supabaseAdmin) ? supabaseAdmin : supabase

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const inputUrl = formData.get('url') as string
  const file = formData.get('file') as File | null

  let finalUrl = inputUrl
  let sizeMb = 0

  if (file && file.size > 0) {
    // 5MB limit check
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'File melebihi batas 5MB. Gunakan URL (Google Drive, dll).' }
    }
    
    // Upload to Supabase Storage bucket 'design_assets'
    // Generate unique name
    const fileExt = file.name.split('.').pop()
    const fileName = `${orgId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data: uploadData, error: uploadErr } = await db.storage
      .from('design_assets')
      .upload(fileName, file)
      
    if (uploadErr) {
      return { error: 'Gagal upload file: ' + uploadErr.message }
    }

    // Get public URL
    const { data: urlData } = db.storage.from('design_assets').getPublicUrl(fileName)
    finalUrl = urlData.publicUrl
    sizeMb = file.size / (1024 * 1024)
  }

  // Insert to DB
  const { error } = await db.from('design_assets').insert({
    organization_id: orgId,
    name,
    category,
    url: finalUrl,
    uploader_id: user.id,
    uploader_name: profile?.full_name || 'Admin',
    size_mb: sizeMb
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/design/assets')
  return { success: true }
}

export async function deleteAsset(id: string) {
  const { isSuperAdmin, supabaseAdmin } = await getTenantContext()
  const supabase = await createClient()
  const db = (isSuperAdmin && supabaseAdmin) ? supabaseAdmin : supabase
  
  // get asset details first
  const { data: asset } = await db.from('design_assets').select('url').eq('id', id).single()
  
  // if url points to our storage, we should ideally delete the object too
  // public url format: .../storage/v1/object/public/design_assets/[path]
  if (asset?.url && asset.url.includes('design_assets')) {
    try {
      const parts = asset.url.split('design_assets/')
      if (parts.length > 1) {
        const filePath = parts[1]
        await db.storage.from('design_assets').remove([filePath])
      }
    } catch(e) {
      console.error('Failed to delete file from storage', e)
    }
  }

  const { error } = await db.from('design_assets').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/design/assets')
  return { success: true }
}
