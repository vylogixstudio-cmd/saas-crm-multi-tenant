import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import QcClient from './QcClient'

export const dynamic = 'force-dynamic'

export default async function QualityControlPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) {
    redirect('/login')
  }

  if (isSuspended) {
    redirect('/suspended')
  }

  if (!orgId) {
    redirect('/dashboard')
  }

  // Ambil semua project fisik yang berstatus Quality Control
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, title, status, deadline,
      profiles!projects_client_id_fkey(full_name),
      project_physical_details(item_type, quantity, material_notes, size_notes, color_notes)
    `)
    .eq('organization_id', orgId)
    .eq('project_category', 'PHYSICAL')
    .eq('status', 'qc_pending')
    .order('deadline', { ascending: true })

  return <QcClient initialProjects={projects || []} />
}
