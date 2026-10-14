import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import ConfirmationClient from './ConfirmationClient'

export default async function ConfirmationPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch projects that are in shipping or have return/complaint requests
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
    .in('status', ['shipped', 'revision_pending', 'ready_to_ship', 'packing_completed'])
    .order('updated_at', { ascending: false })

  const shippingOrComplaintProjects = (projects || []).filter(p => {
    const detail = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details
    return detail?.shipping_status === 'SHIPPED' || detail?.shipping_status === 'RETURN_REQUESTED'
  })

  return <ConfirmationClient initialProjects={shippingOrComplaintProjects} />
}
