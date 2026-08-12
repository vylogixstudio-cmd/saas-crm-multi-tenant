'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePackingStatus(projectId: string) {
  const supabase = await createClient()
  
  // Update project status
  const { error } = await supabase
    .from('projects')
    .update({ 
      status: 'packing_completed',
      progress_percentage: 90
    })
    .eq('id', projectId)

  if (error) return { error: error.message }

  // Update physical detail (set shipping_status to WAITING)
  await supabase
    .from('project_physical_details')
    .update({ shipping_status: 'WAITING' })
    .eq('project_id', projectId)

  // Add internal note
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    await supabase.from('internal_notes').insert({
      project_id: projectId,
      organization_id: profile?.organization_id,
      author_id: user.id,
      content: '[SISTEM] Pesanan selesai dipacking dan siap untuk dilabel/dikirim.'
    })
  }

  revalidatePath('/dashboard/packing')
  return { success: true }
}
