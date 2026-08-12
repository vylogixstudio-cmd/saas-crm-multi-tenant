import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import PackingClient from './PackingClient'

export default async function PackingPage() {
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

  // Fetch projects ready for packing
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number, email),
      project_physical_details (*),
      internal_notes (*, author:author_id(full_name))
    `)
    .eq('organization_id', profile.organization_id)
    .eq('project_category', 'PHYSICAL')
    .eq('status', 'ready_to_ship')
    .order('created_at', { ascending: false })

  const filteredProjects = (projects || []).filter(p => {
    const detail = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details
    return detail?.shipping_status !== 'SHIPPED' && detail?.shipping_status !== 'DELIVERED'
  })

  return <PackingClient initialProjects={filteredProjects} />
}
