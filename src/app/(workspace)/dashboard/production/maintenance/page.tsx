import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MaintenanceClient from './MaintenanceClient'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/login')

  // Fetch real tickets
  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      profiles:reported_by (full_name)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return <MaintenanceClient initialTickets={tickets || []} />
}
