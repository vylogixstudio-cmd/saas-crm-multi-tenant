'use server'

import { getTenantContext } from '@/utils/tenant'
import { revalidatePath } from 'next/cache'

export async function addStaff(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string
  const whatsappNumber = formData.get('whatsappNumber') as string

  if (!email || !password || !fullName || !role) {
    return { error: 'Semua kolom wajib diisi kecuali Nomor WA.' }
  }

  const { user, profile, orgId, role: effectiveRole, isSuperAdmin, supabaseAdmin } = await getTenantContext()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!orgId || (effectiveRole !== 'admin' && !isSuperAdmin)) {
    return { error: 'Hanya Admin Agensi yang dapat mendaftarkan staf.' }
  }

  // Cek kuota staf (Opsional, untuk SaaS)
  // ...

  // Buat user baru di auth.users lewat Admin API
  const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role // Trigger akan membaca ini
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!newAuthUser.user) {
    return { error: 'Gagal membuat user.' }
  }

  // Update profile untuk assign organization_id dan nomor WA
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      organization_id: orgId,
      whatsapp_number: whatsappNumber || null 
    })
    .eq('id', newAuthUser.user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // Catat di Audit Log
  await supabaseAdmin.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_id: user.id,
    actor_email: user.email,
    action: 'staff.create',
    target_type: 'staff',
    target_name: fullName,
    metadata: { role }
  })

  revalidatePath('/dashboard/team')
  return { success: true }
}
