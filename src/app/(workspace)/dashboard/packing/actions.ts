'use server'

import { getTenantContext } from '@/utils/tenant'
import { revalidatePath } from 'next/cache'

export async function updatePackingStatus(projectId: string) {
  const { user, orgId, supabaseAdmin } = await getTenantContext()
  
  if (!user) return { error: 'Not authenticated' }
  if (!orgId) return { error: 'No organization' }

  // 1. Update project status
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ 
      status: 'packing_completed',
      progress_percentage: 90,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  // 2. Update physical detail (set shipping_status to WAITING)
  await supabaseAdmin
    .from('project_physical_details')
    .update({ 
      shipping_status: 'WAITING',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)

  // 3. Add internal note
  await supabaseAdmin.from('internal_notes').insert({
    project_id: projectId,
    organization_id: orgId,
    author_id: user.id,
    content: '[SISTEM] Pesanan selesai dipacking dan siap untuk dilabel/dikirim.',
    visible_to_client: true
  })

  revalidatePath('/dashboard/packing')
  revalidatePath('/dashboard/shipping')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/portal/project/${projectId}`)
  revalidatePath('/portal')
  return { success: true }
}
