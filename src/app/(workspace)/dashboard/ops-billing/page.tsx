import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OpsBillingClient from './OpsBillingClient'

export default async function OpsBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) {
    redirect('/dashboard')
  }

  // Only allow ops, finance, admin, super_admin
  const allowedRoles = ['staff_ops', 'staff_finance', 'admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch all projects for this organization with client data
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name, email)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#111827] font-['Plus_Jakarta_Sans']">Pantau Pembayaran</h1>
          <p className="text-[#6B7280] text-sm mt-1">Pantau status pembayaran proyek klien. Akses khusus untuk tim operasional dan keuangan.</p>
        </div>

        <OpsBillingClient projects={projects || []} />
      </div>
    </div>
  )
}
