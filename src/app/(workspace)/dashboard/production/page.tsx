import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import ProductionClient from './ProductionClient'

export default async function ProductionPage() {
  // Auth check pakai user client
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  // Pakai admin client untuk query data (bypass RLS — staff_production tidak punya projects.read)
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) redirect('/login')

  // Fetch active PHYSICAL projects only
  const { data: activeProjects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number),
      project_physical_details (*),
      internal_notes (*, author:author_id(full_name, email))
    `)
    .eq('organization_id', profile.organization_id)
    .eq('project_category', 'PHYSICAL')
    .neq('status', 'completed')
    .neq('status', 'selesai')
    .order('created_at', { ascending: false })

  return <ProductionClient initialProjects={activeProjects || []} userRole={profile.role} />
}
