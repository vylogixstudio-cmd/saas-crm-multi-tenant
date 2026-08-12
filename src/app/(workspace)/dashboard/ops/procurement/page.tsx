import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProcurementClient from './ProcurementClient'

export const metadata = {
  title: 'Pengajuan Belanja | Vylogix CRM',
  description: 'Pengajuan dana belanja operasional',
}

export default async function OpsProcurementPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Ambil profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) {
    redirect('/dashboard')
  }

  // 3. Ambil data pengajuan belanja
  // PENTING: Jika tabel belum ada, ini mungkin error. 
  // Pastikan user sudah run SQL di Supabase.
  const { data: requests, error } = await supabase
    .from('procurement_requests')
    .select(`
      id, title, amount, description, status, created_at,
      requested_by:profiles!procurement_requests_requested_by_fkey ( full_name, email )
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching procurement requests:', error)
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#111827] font-['Plus_Jakarta_Sans'] tracking-tight mb-2">
            Pengajuan Belanja (Dana)
          </h1>
          <p className="text-[#4B5563] text-sm max-w-2xl">
            Ajukan permohonan dana untuk belanja kebutuhan Gudang atau Produksi ke divisi Keuangan (CS).
          </p>
        </div>

        {error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <h3 className="font-bold mb-2">Tabel Database Belum Tersedia</h3>
            <p>Silakan jalankan script SQL `procurement_table.sql` di Supabase Dashboard untuk membuat tabel pengajuan dana terlebih dahulu.</p>
          </div>
        ) : (
          <ProcurementClient requests={(requests || []) as any} currentUserId={user.id} />
        )}
      </div>
    </div>
  )
}
