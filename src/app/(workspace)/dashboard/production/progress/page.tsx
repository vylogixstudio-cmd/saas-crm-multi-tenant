import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProgressClient from './ProgressClient'

export const dynamic = 'force-dynamic'

export default async function ProductionProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get org id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    redirect('/dashboard')
  }

  // Ambil semua project fisik yang belum selesai sepenuhnya (atau tidak dibatalkan)
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, title, status, deadline,
      profiles!projects_client_id_fkey(full_name),
      project_physical_details(item_type, quantity)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('project_category', 'PHYSICAL')
    .not('status', 'eq', 'Selesai (Siap Kirim)')
    .not('status', 'eq', 'Cancelled')

  return <ProgressClient initialProjects={projects || []} />
}
