import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import ProductionClient from './ProductionClient'

export default async function ProductionPage() {
  const { user, profile, orgId, role, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

  // Fetch active PHYSICAL projects only
  const { data: activeProjects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number),
      project_physical_details (*),
      internal_notes (*, author:author_id(full_name, email))
    `)
    .eq('organization_id', orgId)
    .eq('project_category', 'PHYSICAL')
    .neq('status', 'completed')
    .neq('status', 'selesai')
    .order('created_at', { ascending: false })

  return <ProductionClient initialProjects={activeProjects || []} userRole={role || 'admin'} />
}
