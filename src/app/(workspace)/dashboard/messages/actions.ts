'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function sendGlobalMessage(formData: FormData) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid.' }
  }

  const supabase = createAdminClient()

  // Ambil profile untuk mendapatkan organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) {
    return { error: 'Organisasi tidak ditemukan.' }
  }

  const content = formData.get('content') as string
  const file = formData.get('file') as File | null
  
  const taggedProjectsStr = formData.get('tagged_projects') as string | null
  let taggedProjects = null
  if (taggedProjectsStr) {
    try {
      taggedProjects = JSON.parse(taggedProjectsStr)
    } catch (e) {
      console.error(e)
    }
  }

  if (!content && !file) {
    return { error: 'Pesan tidak boleh kosong.' }
  }

  let fileUrl = null

  // Proses Upload File jika ada
  if (file && file.size > 0) {
    // Validasi ukuran (contoh: max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Ukuran file maksimal 10MB.' }
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat/${profile.organization_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        return { error: `Gagal upload file: ${uploadError.message}` }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

      fileUrl = publicUrlData.publicUrl
    } catch (e: any) {
      return { error: `Terjadi kesalahan saat upload file: ${e.message}` }
    }
  }

  // Insert ke database
  const { error: insertError } = await supabase
    .from('global_messages')
    .insert({
      organization_id: profile.organization_id,
      author_id: user.id,
      content: content || 'Mengirim file lampiran',
      file_url: fileUrl,
      tagged_projects: taggedProjects
    })

  if (insertError) {
    return { error: `Gagal menyimpan pesan: ${insertError.message}` }
  }

  // Meskipun pakai realtime, revalidate path disarankan untuk SSR
  revalidatePath('/dashboard/messages')

  return { success: true }
}
