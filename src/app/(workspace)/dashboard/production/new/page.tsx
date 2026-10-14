import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import NewProductionClient from './NewProductionClient'

export default async function NewProductionPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch Clients for Dropdown
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('organization_id', orgId)
    .eq('role', 'client')
    .order('full_name')

  // Fetch Services for Dropdown
  const { data: services } = await supabase
    .from('agency_services')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name')

  return <NewProductionClient clients={clients || []} services={services || []} />
}
