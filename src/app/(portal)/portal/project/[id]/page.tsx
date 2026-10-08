import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PortalProjectClient from './PortalProjectClient'

export const dynamic = 'force-dynamic'

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  // Pastikan proyek milik klien ini
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:client_id (full_name, email, whatsapp_number)
    `)
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!project) redirect('/portal')

  const projectCategory = project.project_category ?? 'DIGITAL'

  const [
    { data: invoices },
    { data: notes },
    { data: assets },
    { data: revisions },
    { data: org },
    digitalDetailsResult,
    physicalDetailsResult,
  ] = await Promise.all([
    supabase
      .from('fin_invoices')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),

    supabase
      .from('internal_notes')
      .select('*, profiles:author_id (full_name)')
      .eq('project_id', id)
      .eq('visible_to_client', true)
      .order('created_at', { ascending: true }),

    supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('project_revisions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),

    project.organization_id
      ? supabase
          .from('organizations')
          .select('name, logo_url, whatsapp_number, industry_type, tagline')
          .eq('id', project.organization_id)
          .single()
      : Promise.resolve({ data: null }),

    projectCategory === 'DIGITAL'
      ? supabase
          .from('project_digital_details')
          .select('*')
          .eq('project_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    projectCategory === 'PHYSICAL'
      ? supabase
          .from('project_physical_details')
          .select('*')
          .eq('project_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div>
      {/* Back */}
      <Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        ← Kembali ke Beranda
      </Link>

      <PortalProjectClient
        project={project}
        invoices={invoices || []}
        notes={notes || []}
        assets={assets || []}
        revisions={revisions || []}
        org={org}
        digitalDetails={digitalDetailsResult.data ?? null}
        physicalDetails={physicalDetailsResult.data ?? null}
        currentUserId={user.id}
      />
    </div>
  )
}
