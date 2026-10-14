import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

const PUBLIC_ONLY_ROUTES = ['/login', '/']

function isPublicOnlyRoute(pathname: string): boolean {
  return PUBLIC_ONLY_ROUTES.includes(pathname)
}

function isOrganizationSuspended(org: OrganizationData): boolean {
  if (org.is_active === false) return true
  if (org.auto_suspend && org.license_expires_at) {
    return new Date() > new Date(org.license_expires_at)
  }
  return false
}

function redirectWithCookies(url: URL | string, supabaseResponse: NextResponse) {
  const redirectRes = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectRes.cookies.set(cookie.name, cookie.value, { ...cookie })
  })
  return redirectRes
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()
  const { pathname } = url

  // 1. Deteksi Mode Domain berdasarkan Hostname dari Vercel / Local
  const hostname = request.headers.get('host') || ''
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.startsWith('192.168.')
  
  let appMode: 'superadmin' | 'client' | 'agency' = 'agency' // default fallback
  
  if (hostname.includes('superadmin')) {
    appMode = 'superadmin'
  } else if (hostname.includes('klien') || hostname.includes('client')) {
    appMode = 'client'
  }
  
  // Override untuk local development jika diinginkan
  if (process.env.NEXT_PUBLIC_APP_MODE === 'superadmin') appMode = 'superadmin'
  if (process.env.NEXT_PUBLIC_APP_MODE === 'client') appMode = 'client'

  // Jika belum login
  if (userError || !user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal') || pathname.startsWith('/super-admin')) {
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    return supabaseResponse
  }

  // Jika sudah login, ambil profile & role
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

  const isSuperAdmin = profile.role === 'super_admin' || profile.role === 'superadmin'
  const isClient = profile.role === 'client'
  const isImpersonating = !!request.cookies.get('vylogix_impersonate_org')?.value

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ATURAN ROUTING LOCALHOST: Fleksibel untuk semua role tanpa signOut
  // ─────────────────────────────────────────────────────────────────────────
  if (isLocalhost && !process.env.NEXT_PUBLIC_APP_MODE) {
    if (isSuperAdmin) {
      if (isPublicOnlyRoute(pathname)) {
        url.pathname = '/super-admin'
        return redirectWithCookies(url, supabaseResponse)
      }
      if (pathname.startsWith('/portal')) {
        url.pathname = '/super-admin'
        return redirectWithCookies(url, supabaseResponse)
      }
      // Super admin bebas akses /super-admin dan /dashboard (impersonasi / testing)
      return supabaseResponse
    }

    if (isClient) {
      if (isPublicOnlyRoute(pathname) || pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin')) {
        url.pathname = '/portal'
        return redirectWithCookies(url, supabaseResponse)
      }
      return supabaseResponse
    }

    // Role Agency Staff / Admin di localhost
    if (isPublicOnlyRoute(pathname) || pathname.startsWith('/super-admin') || pathname.startsWith('/portal')) {
      url.pathname = '/dashboard'
      return redirectWithCookies(url, supabaseResponse)
    }

    // Check suspend untuk agency
    if (pathname.startsWith('/dashboard')) {
      const org = profile.organizations
      if (!profile.organization_id) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }
      if (org && isOrganizationSuspended(org)) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }
    }
    return supabaseResponse
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ATURAN ROUTING PRODUCTION DOMAIN
  // ─────────────────────────────────────────────────────────────────────────

  // --- MODE SUPER ADMIN ---
  if (appMode === 'superadmin') {
    if (!isSuperAdmin) {
      await supabase.auth.signOut()
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (isPublicOnlyRoute(pathname)) {
      url.pathname = '/super-admin'
      return redirectWithCookies(url, supabaseResponse)
    }
    // Jika super admin sedang impersonasi agensi, izinkan akses /dashboard
    if (pathname.startsWith('/dashboard') && isImpersonating) {
      return supabaseResponse
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      url.pathname = '/super-admin'
      return redirectWithCookies(url, supabaseResponse)
    }
  } 
  
  // --- MODE CLIENT PORTAL ---
  else if (appMode === 'client') {
    if (!isClient) {
      await supabase.auth.signOut()
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (isPublicOnlyRoute(pathname)) {
      url.pathname = '/portal'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin')) {
      url.pathname = '/portal'
      return redirectWithCookies(url, supabaseResponse)
    }
  } 
  
  // --- MODE AGENCY (DASHBOARD) ---
  else {
    // Izinkan Super Admin masuk dashboard jika sedang impersonasi
    if (isSuperAdmin && isImpersonating && pathname.startsWith('/dashboard')) {
      return supabaseResponse
    }

    if (isClient || isSuperAdmin) {
      await supabase.auth.signOut()
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (isPublicOnlyRoute(pathname)) {
      url.pathname = '/dashboard'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (pathname.startsWith('/super-admin') || pathname.startsWith('/portal')) {
      url.pathname = '/dashboard'
      return redirectWithCookies(url, supabaseResponse)
    }

    // Cek suspend khusus untuk agency
    if (pathname.startsWith('/dashboard')) {
      const org = profile.organizations
      const hasOrgId = !!profile.organization_id

      // Jika tidak punya org sama sekali → suspended
      if (!hasOrgId) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }

      // Jika org data bisa dibaca & memang suspended → suspended
      // Jika org null tapi organization_id ada (RLS block) → biarkan masuk, anggap aktif
      if (org && isOrganizationSuspended(org)) {
        url.pathname = '/suspended'
        return redirectWithCookies(url, supabaseResponse)
      }
    } else if (pathname === '/suspended') {
      // Jika tidak suspend tapi akses /suspended
      const org = profile.organizations
      if (org && !isOrganizationSuspended(org)) {
        url.pathname = '/dashboard'
        return redirectWithCookies(url, supabaseResponse)
      }
      // Jika org null tapi punya organization_id (RLS block) → redirect ke dashboard
      if (!org && !!profile.organization_id) {
        url.pathname = '/dashboard'
        return redirectWithCookies(url, supabaseResponse)
      }
    }
  }

  return supabaseResponse
}
