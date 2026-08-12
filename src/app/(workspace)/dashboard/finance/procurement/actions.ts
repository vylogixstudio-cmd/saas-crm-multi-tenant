'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProcurementStatus(id: string, newStatus: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check valid status
  if (!['APPROVED', 'REJECTED', 'PAID'].includes(newStatus)) {
    return { error: 'Invalid status' }
  }

  const { error } = await supabase
    .from('procurement_requests')
    .update({
      status: newStatus,
      approved_by: user.id
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating procurement request:', error)
    return { error: 'Gagal mengubah status pengajuan' }
  }

  // Refresh both pages
  revalidatePath('/dashboard/finance/procurement')
  revalidatePath('/dashboard/ops/procurement')
  return { success: true }
}
