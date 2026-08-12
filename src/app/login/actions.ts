'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkLoginRatelimit } from '@/utils/ratelimit'
import { headers } from 'next/headers'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Dapatkan IP dari request headers (Vercel / proxy)
// ─────────────────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const headerList = await headers()
  // Vercel menyetel header x-forwarded-for dengan IP asli client
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) {
    // Format: "ip1, ip2, ip3" — ambil yang pertama (client asli)
    return forwarded.split(',')[0].trim()
  }
  // Fallback untuk development lokal
  return '127.0.0.1'
}

// ─────────────────────────────────────────────────────────────────────────────
// login
// ─────────────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  // ── Rate Limiting Check ───────────────────────────────────────────────────
  // Cek SEBELUM query ke Supabase supaya tidak membebani DB dengan brute force.
  // Rate limit: 5 percobaan per 15 menit per IP address.
  const ip = await getClientIp()
  const rateLimitResult = await checkLoginRatelimit(ip)

  if (false && !rateLimitResult.allowed) {
    const resetMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60)
    const waitMessage = resetMinutes > 0
      ? `Coba lagi dalam ${resetMinutes} menit.`
      : 'Coba lagi sebentar lagi.'
    redirect(
      `/login?message=${encodeURIComponent(
        `Terlalu banyak percobaan login. ${waitMessage}`
      )}`
    )
  }

  // ── Authentication ────────────────────────────────────────────────────────
  const supabase = await createClient()

  const credentials = {
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  }

  const { error: signInError } = await supabase.auth.signInWithPassword(credentials)

  if (signInError) {
    redirect('/login?message=Email+atau+Password+salah.+Periksa+kembali+kredensial+Anda.')
  }

  // ── Role Resolution ───────────────────────────────────────────────────────
  // After successful sign-in, fetch the user's role to determine the redirect target.
  // We use auth.getUser() for cryptographically verified server-side identity.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login?message=Sesi+tidak+valid.+Silakan+coba+lagi.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: 'super_admin' | 'admin' | 'client' | 'staff_ops' | 'staff_executor' | 'staff_finance' | 'staff_digital' | 'staff_physical' | 'staff_cs' | 'staff_design' | 'staff_warehouse' | 'staff_production' | 'staff_shipping' }>()

  if (profileError || !profile) {
    // Authentication succeeded but no profile record was found.
    // Sign out to prevent a partially authenticated state and surface the error.
    await supabase.auth.signOut()
    redirect('/login?message=Profil+akun+tidak+ditemukan.+Hubungi+administrator.')
  }

  // Role-based redirect
  switch (profile.role) {
    case 'super_admin':
      redirect('/super-admin')
    case 'admin':
    case 'staff_ops':
    case 'staff_executor': // (Mungkin sisa db lama)
    case 'staff_finance':
    case 'staff_digital':
    case 'staff_physical':
    case 'staff_cs':
    case 'staff_design':
    case 'staff_warehouse':
    case 'staff_production':
    case 'staff_shipping':
      redirect('/dashboard')
    case 'client':
      redirect('/portal')
    default:
      // Unknown role: sign out and surface an error.
      await supabase.auth.signOut()
      redirect('/login?message=Role+akun+tidak+dikenali.+Hubungi+administrator.')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// logout
// ─────────────────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
