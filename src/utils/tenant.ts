import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { cookies } from 'next/headers'

export interface TenantContext {
  user: any
  profile: any
  orgId: string | null
  org: any | null
  role: string | null
  actualRole: string | null
  isSuperAdmin: boolean
  isImpersonating: boolean
  isSuspended: boolean
  supabaseAdmin: ReturnType<typeof createAdminClient>
}

/**
 * Mengambil konteks tenant/agensi yang aktif saat ini.
 * Mendukung akses normal staf/admin agensi DAN akses impersonasi Super Admin.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()

  const supabaseAdmin = createAdminClient()

  if (!user) {
    return {
      user: null,
      profile: null,
      orgId: null,
      org: null,
      role: null,
      actualRole: null,
      isSuperAdmin: false,
      isImpersonating: false,
      isSuspended: false,
      supabaseAdmin,
    }
  }

  // Ambil profil user
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, organization_id')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'superadmin'

  const cookieStore = await cookies()
  const impersonatedOrgId = isSuperAdmin
    ? cookieStore.get('vylogix_impersonate_org')?.value || null
    : null

  const isImpersonating = Boolean(isSuperAdmin && impersonatedOrgId)
  const effectiveOrgId = isImpersonating ? impersonatedOrgId : profile?.organization_id || null
  const effectiveRole = isImpersonating ? 'admin' : profile?.role || null

  let org: any = null
  let isSuspended = false

  if (effectiveOrgId) {
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', effectiveOrgId)
      .single()

    if (orgData) {
      org = orgData
      const isExpired = orgData.license_expires_at
        ? new Date() > new Date(orgData.license_expires_at)
        : false

      // Super admin yang sedang impersonasi tidak diblokir oleh suspend
      if (!isImpersonating && (orgData.is_active === false || (orgData.auto_suspend && isExpired))) {
        isSuspended = true
      }
    }
  }

  return {
    user,
    profile,
    orgId: effectiveOrgId,
    org,
    role: effectiveRole,
    actualRole: profile?.role || null,
    isSuperAdmin,
    isImpersonating,
    isSuspended,
    supabaseAdmin,
  }
}
