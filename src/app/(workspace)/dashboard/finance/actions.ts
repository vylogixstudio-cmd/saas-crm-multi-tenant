'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) return { error: 'Organisasi tidak ditemukan.' }
  const orgId = profile.organization_id

  const type = formData.get('type') as string
  const categoryId = formData.get('category_id') as string
  const amountStr = formData.get('amount') as string
  const description = formData.get('description') as string
  const amount = Number(amountStr) || 0

  if (!type || !categoryId || amount <= 0) {
    return { error: 'Data tidak lengkap atau nominal tidak valid.' }
  }

  const { error } = await supabase
    .from('fin_transactions')
    .insert({
      organization_id: orgId,
      category_id: categoryId,
      type,
      amount,
      description
    })

  if (error) {
    return { error: 'Gagal menambahkan transaksi.' }
  }

  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function addCategory(formData: FormData) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) return { error: 'Organisasi tidak ditemukan.' }
  const orgId = profile.organization_id

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  if (!name || !type) return { error: 'Nama dan tipe wajib diisi.' }

  const { error } = await supabase
    .from('fin_categories')
    .insert({
      organization_id: orgId,
      name,
      type
    })

  if (error) return { error: 'Gagal menambahkan kategori.' }

  revalidatePath('/dashboard/finance')
  return { success: true }
}
