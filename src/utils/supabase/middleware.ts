import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

interface OrganizationData {
  is_active: boolean
  auto_suspend: boolean
  license_expires_at: string | null
}

interface ProfileWithOrg {
  role: string
  organization_id: string | null
  organizations: OrganizationData | null
}

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

const PROTECTED_ROUTE_PREFIXES = ['/super-admin', '/dashboard', '/portal']
const PUBLIC_ONLY_ROUTES = ['/login', '/']

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isPublicOnlyRoute(pathname: string): boolean {
  return PUBLIC_ONLY_ROUTES.includes(pathname)
}

// ---------------------------------------------------------------------------
// Suspension Check Logic
// ---------------------------------------------------------------------------

function isOrganizationSuspended(org: OrganizationData): boolean {
  if (org.is_active === false) {
    return true
  }
  if (org.auto_suspend && org.license_expires_at) {
    const isExpired = new Date() > new Date(org.license_expires_at)
    if (isExpired) {
      return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// Role Guard Logic
// ---------------------------------------------------------------------------

function getRoleRequiredForPath(pathname: string): string | null {
  if (pathname.startsWith('/super-admin')) return 'super_admin'
  // Untuk /(workspace)/dashboard, RBAC dinamis ditangani di level halaman/layout Server Components
  return null
}

function getDefaultRedirectForRole(role: string): string {
  if (role === 'super_admin') return '/super-admin'
  if (role === 'client') return '/portal'
  return '/dashboard' // Admin, Staff
}

// ---------------------------------------------------------------------------
// Cookie Propagation Helper
// ---------------------------------------------------------------------------

function redirectWithCookies(url: URL | string, supabaseResponse: NextResponse) {
  const redirectRes = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectRes.cookies.set(cookie.name, cookie.value, { ...cookie })
  })
  return redirectRes
}

// ---------------------------------------------------------------------------
// Main updateSession Function
// ---------------------------------------------------------------------------

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const { pathname } = url

  if (userError || !user) {
    if (isProtectedRoute(pathname)) {
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    return supabaseResponse
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, organization_id, organizations(is_active, auto_suspend, license_expires_at)')
    .eq('id', user.id)
    .single<ProfileWithOrg>()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    url.pathname = '/login'
    return redirectWithCookies(url, supabaseResponse)
  }

  if (isPublicOnlyRoute(pathname)) {
    url.pathname = getDefaultRedirectForRole(profile.role)
    return redirectWithCookies(url, supabaseResponse)
  }

  if (isProtectedRoute(pathname)) {
    // Suspend hanya berlaku untuk admin/staff, BUKAN super_admin dan BUKAN client
    if (profile.role !== 'client' && profile.role !== 'super_admin') {
      const org = profile.organizations

      if (!org) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }

      if (isOrganizationSuspended(org)) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }
    }

    const requiredRole = getRoleRequiredForPath(pathname)

    if (requiredRole !== null && profile.role !== requiredRole) {
      url.pathname = getDefaultRedirectForRole(profile.role)
      return redirectWithCookies(url, supabaseResponse)
    }

    // Guard: klien tidak boleh akses /dashboard
    if (pathname.startsWith('/dashboard') && profile.role === 'client') {
      url.pathname = '/portal'
      return redirectWithCookies(url, supabaseResponse)
    }

    // Guard: non-klien tidak boleh akses /portal
    if (pathname.startsWith('/portal') && profile.role !== 'client') {
      url.pathname = getDefaultRedirectForRole(profile.role)
      return redirectWithCookies(url, supabaseResponse)
    }
  }

  return supabaseResponse
}
