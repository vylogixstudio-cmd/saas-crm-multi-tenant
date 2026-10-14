import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import PackingClient from './PackingClient'

export default async function PackingPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch projects ready for packing
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number, email),
      project_physical_details (*),
      internal_notes (*, author:author_id(full_name))
    `)
    .eq('organization_id', orgId)
    .eq('project_category', 'PHYSICAL')
    .eq('status', 'ready_to_ship')
    .order('created_at', { ascending: false })

  const filteredProjects = (projects || []).filter(p => {
    const detail = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details
    return detail?.shipping_status !== 'SHIPPED' && detail?.shipping_status !== 'DELIVERED'
  })

  return <PackingClient initialProjects={filteredProjects} />
}
