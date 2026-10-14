import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getTenantContext } from '@/utils/tenant'
import DashboardLayoutClient from './DashboardLayoutClient'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getTenantContext()
  const {
    user,
    profile,
    orgId,
    org,
    role,
    actualRole,
    isSuperAdmin,
    isImpersonating,
    isSuspended,
    supabaseAdmin,
  } = context

  if (!user) {
    redirect('/login')
  }

  // Jika super admin masuk ke dashboard tanpa impersonasi agensi, arahkan ke super-admin console
  if (isSuperAdmin && !isImpersonating) {
    redirect('/super-admin')
  }

  // Jika agensi disuspend (dan bukan super admin yang sedang impersonasi)
  if (isSuspended) {
    redirect('/suspended')
  }

  // Ambil permission roles
  let permissions: string[] = []
  if (role && role !== 'client') {
    // Jika admin atau super_admin yang sedang impersonasi, dapatkan permission admin
    const targetRoleSlug = role === 'admin' || role === 'super_admin' ? 'admin' : role
    const { data: perms } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_slug')
      .eq('role_slug', targetRoleSlug)

    if (perms) {
      permissions = perms.map((p: any) => p.permission_slug)
    }
  }

  // Hitung updateCount & splitRequestCount untuk organisasi terkait
  let updateCount = 0
  let splitRequestCount = 0

  if (orgId && role !== 'client') {
    const { count: uCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'update_pengajuan')

    if (uCount !== null && uCount !== undefined) updateCount = uCount

    const { count: sCount } = await supabaseAdmin
      .from('fin_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'SPLIT_REQUESTED')

    if (sCount !== null && sCount !== undefined) splitRequestCount = sCount
  }

  const isIndustryPhysical =
    org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING'
  const isDigital = org?.module_digital !== false && !isIndustryPhysical
  const isPhysical = org?.module_physical === true || isIndustryPhysical

  const orgData = org
    ? {
        name: org.name,
        logo_url: org.logo_url,
      }
    : null

  const userProfile = {
    id: user.id,
    name: profile?.full_name || user.user_metadata?.full_name || 'User',
    email: user.email || '',
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full"></div>
        </div>
      }
    >
      <DashboardLayoutClient
        userProfile={userProfile}
        role={role}
        actualRole={actualRole}
        isImpersonating={isImpersonating}
        impersonatedOrgName={org?.name}
        permissions={permissions}
        updateCount={updateCount}
        splitRequestCount={splitRequestCount}
        orgData={orgData}
        organizationId={orgId}
        activeModules={{ digital: isDigital, physical: isPhysical }}
      >
        {children}
      </DashboardLayoutClient>
    </Suspense>
  )
}
