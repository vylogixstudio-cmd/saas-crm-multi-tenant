'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProcurementRequest(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'No organization found' }

  const title = formData.get('title') as string
  const amount = parseInt(formData.get('amount') as string, 10)
  const description = formData.get('description') as string

  if (!title || !amount) {
    return { error: 'Title and amount are required' }
  }

  const { error } = await supabase
    .from('procurement_requests')
    .insert({
      organization_id: profile.organization_id,
      title,
      amount,
      description,
      status: 'PENDING',
      requested_by: user.id
    })

  if (error) {
    console.error('Error creating procurement request:', error)
    return { error: 'Gagal membuat pengajuan' }
  }

  revalidatePath('/dashboard/ops/procurement')
  return { success: true }
}
