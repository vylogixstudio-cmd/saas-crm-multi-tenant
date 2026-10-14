'use server'

import { getTenantContext } from '@/utils/tenant'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const { user, orgId, isImpersonating, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) return { error: 'Sesi tidak valid.' }
  if (!orgId) return { error: 'Organisasi tidak ditemukan.' }

  if (isImpersonating) {
    return { error: 'Mode Akses Terbatas (Read-Only Guard): Super Admin tidak diizinkan mencatat mutasi finansial kas saat impersonasi.' }
  }

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
  const { user, orgId, isImpersonating, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) return { error: 'Sesi tidak valid.' }
  if (!orgId) return { error: 'Organisasi tidak ditemukan.' }

  if (isImpersonating) {
    return { error: 'Mode Akses Terbatas (Read-Only Guard): Super Admin tidak diizinkan mengubah kategori finansial saat impersonasi.' }
  }

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
