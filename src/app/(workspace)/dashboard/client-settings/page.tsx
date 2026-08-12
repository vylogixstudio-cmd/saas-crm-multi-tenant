import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClientSettingsForm from './ClientSettingsForm'

export const metadata = {
  title: 'Pengaturan Klien | Vylogix CRM',
  description: 'Pengaturan akun klien',
}

export const dynamic = 'force-dynamic'

export default async function ClientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil data profile klien
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] mb-2">
            Pengaturan Akun
          </h1>
          <p className="text-[#4B5563] text-sm mb-8">
            Kelola informasi kontak dan keamanan akun Anda. Nama akun dikelola oleh administrator untuk memudahkan pelacakan.
          </p>

          <ClientSettingsForm 
            initialName={profile.full_name || ''} 
            initialWhatsapp={profile.whatsapp_number || ''} 
          />
        </div>
      </div>
    </div>
  )
}
