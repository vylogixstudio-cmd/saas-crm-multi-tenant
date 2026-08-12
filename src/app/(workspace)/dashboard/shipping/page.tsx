import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import ShippingClient from './ShippingClient'

export default async function ShippingPage() {
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

  // Fetch projects ready for shipping (packing completed)
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, whatsapp_number, email),
      project_physical_details (*)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('project_category', 'PHYSICAL')
    .in('status', ['packing_completed', 'ready_to_ship'])
    .order('created_at', { ascending: false })

  return <ShippingClient initialProjects={projects || []} />
}
