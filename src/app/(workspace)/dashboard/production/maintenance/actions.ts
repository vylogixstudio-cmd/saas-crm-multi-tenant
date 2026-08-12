'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaintenanceTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) return { success: false, error: 'No org' }

  const machineName = formData.get('machine_name') as string
  const issueDescription = formData.get('issue_description') as string
  const priority = (formData.get('priority') as string) || 'medium'

  if (!machineName || !issueDescription) {
    return { success: false, error: 'Nama mesin dan kendala wajib diisi.' }
  }

  const { error } = await supabase
    .from('maintenance_tickets')
    .insert({
      organization_id: profile.organization_id,
      machine_name: machineName,
      issue_description: issueDescription,
      priority: priority,
      status: 'pending',
      reported_by: user.id
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/production/maintenance')
  return { success: true }
}

export async function updateMaintenanceTicketStatus(ticketId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('maintenance_tickets')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/production/maintenance')
  return { success: true }
}
