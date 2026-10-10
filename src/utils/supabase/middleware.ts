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
  let appMode: 'superadmin' | 'client' | 'agency' = 'agency' // default fallback
  
  if (hostname.includes('superadmin')) {
    appMode = 'superadmin'
  } else if (hostname.includes('klien') || hostname.includes('client')) {
    appMode = 'client'
  }
  
  // Override untuk local development (bisa diset di .env.local)
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

  // 2. Domain-based Auth Rules

  // --- MODE SUPER ADMIN ---
  if (appMode === 'superadmin') {
    if (profile.role !== 'super_admin' && profile.role !== 'superadmin') {
      await supabase.auth.signOut()
      url.pathname = '/login'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (isPublicOnlyRoute(pathname)) {
      url.pathname = '/super-admin'
      return redirectWithCookies(url, supabaseResponse)
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
      url.pathname = '/super-admin'
      return redirectWithCookies(url, supabaseResponse)
    }
  } 
  
  // --- MODE CLIENT PORTAL ---
  else if (appMode === 'client') {
    if (profile.role !== 'client') {
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
    if (profile.role === 'client' || profile.role === 'super_admin' || profile.role === 'superadmin') {
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
      if (!org || isOrganizationSuspended(org)) {
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
    }
  }

  return supabaseResponse
}
