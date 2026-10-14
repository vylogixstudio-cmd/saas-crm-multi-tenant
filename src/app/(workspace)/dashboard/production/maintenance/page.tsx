import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import MaintenanceClient from './MaintenanceClient'

export default async function MaintenancePage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch real tickets
  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      profiles:reported_by (full_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return <MaintenanceClient initialTickets={tickets || []} />
}
