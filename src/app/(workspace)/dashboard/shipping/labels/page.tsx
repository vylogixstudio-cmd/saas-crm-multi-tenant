import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import LabelsClient from './LabelsClient'

export default async function LabelsPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch projects ready for shipping (packing completed)
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number, email),
      project_physical_details (*)
    `)
    .eq('organization_id', orgId)
    .eq('project_category', 'PHYSICAL')
    .in('status', ['packing_completed', 'ready_to_ship'])
    .order('created_at', { ascending: false })

  return <LabelsClient initialProjects={projects || []} />
}
