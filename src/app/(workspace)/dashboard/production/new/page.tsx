import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NewProductionClient from './NewProductionClient'

export default async function NewProductionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/login')

  // Fetch Clients for Dropdown
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'client')
    .order('full_name')

  // Fetch Services for Dropdown
  const { data: services } = await supabase
    .from('agency_services')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .order('name')

  return <NewProductionClient clients={clients || []} services={services || []} />
}
