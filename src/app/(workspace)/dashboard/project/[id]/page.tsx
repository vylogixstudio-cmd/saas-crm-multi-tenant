import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ActiveProjectView from './components/ActiveProjectView'

// Next.js 15 requires async params
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'staff_executor'
  const orgId = profile?.organization_id

  if (!orgId && userRole !== 'super_admin') {
    redirect('/dashboard')
  }

  let projectQuery = supabase
    .from('projects')
    .select('*, profiles:client_id (full_name, email, whatsapp_number)')
    .eq('id', id)

  if (userRole !== 'super_admin' && orgId) {
    projectQuery = projectQuery.eq('organization_id', orgId)
  }

  const { data: project } = await projectQuery.single()

  if (!project) {
    redirect('/dashboard/projects')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch semua data pendukung secara paralel (Promise.all = lebih cepat)
  // ─────────────────────────────────────────────────────────────────────────
  const projectCategory = project.project_category ?? 'DIGITAL'

  const [
    { data: revisions },
    { data: assets },
    { data: invoices },
    { data: notes },
    organizationResult,
    digitalDetailsResult,
    physicalDetailsResult,
  ] = await Promise.all([
    supabase
      .from('project_revisions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('fin_invoices')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('internal_notes')
      .select('*, profiles:author_id (full_name)')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),

    // Fetch org branding
    project.organization_id
      ? supabase
          .from('organizations')
          .select('name, tagline, logo_url, industry_type')
          .eq('id', project.organization_id)
          .single()
      : supabase
          .from('organizations')
          .select('name, tagline, logo_url, industry_type')
          .order('created_at', { ascending: true })
          .limit(1)
          .single(),

    // Fetch digital details — hanya jika kategori DIGITAL
    projectCategory === 'DIGITAL'
      ? supabase
          .from('project_digital_details')
          .select('*')
          .eq('project_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Fetch physical details — hanya jika kategori PHYSICAL
    projectCategory === 'PHYSICAL'
      ? supabase
          .from('project_physical_details')
          .select('*')
          .eq('project_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <ActiveProjectView 
        project={project} 
        revisions={revisions || []} 
        assets={assets || []} 
        organization={organizationResult.data}
        invoices={invoices || []}
        internalNotes={notes || []}
        currentUserId={user.id}
        userRole={userRole}
        digitalDetails={digitalDetailsResult.data ?? null}
        physicalDetails={physicalDetailsResult.data ?? null}
      />
    </div>
  )
}

