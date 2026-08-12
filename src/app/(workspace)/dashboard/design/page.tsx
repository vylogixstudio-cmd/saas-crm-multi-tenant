import { createClient } from '@/utils/supabase/server'
import DesignClient from './DesignClient'

export default async function DesignQueuePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) return <div>No Organization Found</div>

  // Fetch projects that are physical and in design phases
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles:client_id(full_name, email), project_physical_details(*), project_digital_details(*), project_revisions(*), internal_notes(*)')
    .eq('organization_id', orgId)
    .eq('project_category', 'PHYSICAL')
    .in('status', ['briefing', 'design', 'revision', 'revision_pending'])
    .order('created_at', { ascending: false })

  return <DesignClient initialProjects={projects || []} />
}
