'use server'

import { createClient } from '@/utils/supabase/server'

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const whatsapp = formData.get('whatsapp_number') as string
  const password = formData.get('password') as string

  // Update whatsapp_number di tabel profiles
  if (whatsapp) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ whatsapp_number: whatsapp })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return { error: 'Gagal memperbarui profil' }
    }
  }

  // Update password via Auth jika diisi
  if (password && password.trim().length > 0) {
    if (password.length < 6) {
      return { error: 'Password minimal 6 karakter' }
    }
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    })

    if (authError) {
      console.error('Error updating password:', authError)
      return { error: 'Gagal memperbarui password' }
    }
  }

  return { success: true }
}
