import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export default async function ShippingHistoryPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) redirect('/login')

  // Fetch projects where shipping is completed (DELIVERED)
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number, email),
      project_physical_details (*)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('project_category', 'PHYSICAL')
    .order('updated_at', { ascending: false })

  const deliveredProjects = (projects || []).filter(p => {
    const detail = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details
    return detail?.shipping_status === 'DELIVERED'
  })

  return <HistoryClient initialProjects={deliveredProjects} />
}
