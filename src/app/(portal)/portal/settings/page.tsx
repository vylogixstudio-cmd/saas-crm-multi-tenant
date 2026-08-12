import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Lock, Shield, Building } from 'lucide-react'
import ClientSettingsForm from '@/app/(workspace)/dashboard/client-settings/ClientSettingsForm'

export const metadata = {
  title: 'Pengaturan Akun | Portal Klien',
  description: 'Kelola informasi profil dan keamanan akun portal klien Anda.',
}

export const dynamic = 'force-dynamic'

export default async function PortalSettingsPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // Ambil data profile klien
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: org } = profile?.organization_id
    ? await supabase
        .from('organizations')
        .select('name, logo_url, tagline, industry_type')
        .eq('id', profile.organization_id)
        .single()
    : { data: null }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Back to Portal Home */}
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali ke Beranda Portal
        </Link>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-[24px] border border-black/5 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
          <div>
            <h1 className="font-extrabold text-2xl text-gray-900 font-['Plus_Jakarta_Sans']">
              Pengaturan Akun Portal
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Kelola nomor kontak WhatsApp dan keamanan password akun Anda.
            </p>
          </div>

          {org && (
            <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
              <Building size={16} className="text-gray-400" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Agensi Penyedia</p>
                <p className="text-xs font-extrabold text-gray-900">{org.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* User Info Overview Badge */}
        <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Email Terdaftar</span>
            <span className="font-extrabold text-gray-900">{profile?.email || user.email}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Tipe Portal</span>
            <span className="font-extrabold text-blue-600">
              {org?.industry_type === 'PHYSICAL' ? '📦 Portal Klien Percetakan & Fisik' : '🌐 Portal Klien Digital & Software'}
            </span>
          </div>
        </div>

        {/* Form Settings */}
        <ClientSettingsForm
          initialName={profile?.full_name || ''}
          initialWhatsapp={profile?.whatsapp_number || ''}
        />
      </div>
    </div>
  )
}
