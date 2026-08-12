import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FinanceProcurementClient from './FinanceProcurementClient'

export const metadata = {
  title: 'Approval Pengajuan Dana | Vylogix CRM',
  description: 'Persetujuan dan pencairan dana belanja',
}

export default async function FinanceProcurementPage() {
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

  const userRole = profile.role

  // 3. Ambil data pengajuan belanja
  const { data: requests, error } = await supabase
    .from('procurement_requests')
    .select(`
      id, title, amount, description, status, created_at,
      requested_by:profiles!procurement_requests_requested_by_fkey ( full_name, email ),
      approved_by:profiles!procurement_requests_approved_by_fkey ( full_name, email )
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
            Approval Pengajuan Dana
          </h1>
          <p className="text-[#4B5563] text-sm max-w-2xl">
            Tinjau, setujui, dan cairkan dana untuk kebutuhan belanja dari tim operasional/gudang.
          </p>
        </div>

        {error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <h3 className="font-bold mb-2">Tabel Database Belum Tersedia</h3>
            <p>Silakan jalankan script SQL `procurement_table.sql` di Supabase Dashboard untuk membuat tabel pengajuan dana terlebih dahulu.</p>
          </div>
        ) : (
          <FinanceProcurementClient requests={(requests || []) as any} currentUserId={user.id} />
        )}
      </div>
    </div>
  )
}
