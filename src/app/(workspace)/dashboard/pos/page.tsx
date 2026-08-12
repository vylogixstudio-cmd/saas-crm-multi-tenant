import { createClient } from '@/utils/supabase/server'
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Search, CheckCircle, Clock, ReceiptText } from 'lucide-react'
import PosLayout from './PosLayout'

export default async function PosPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.organization_id) redirect('/login')
  const orgId = profile.organization_id

  // Ambil daftar invoice — batasi 100 terbaru untuk performa
  const { data: invoices } = await supabase
    .from('fin_invoices')
    .select(`
      *,
      profiles:client_id (full_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(500)

  // Ambil data klien untuk dropdown
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('organization_id', orgId)
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  // Ambil proyek aktif — termasuk data termin untuk Invoice Builder
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, client_id, total_price, termin_1, termin_2, termin_3, update_price, payment_status')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  // Ambil layanan agensi
  const { data: services } = await supabase
    .from('agency_services')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  // Ambil antrean request invoice dari semua proyek
  const { data: projectsWithRequests } = await supabase
    .from('projects')
    .select('id, title, client_id, total_price, termin_1, termin_2, termin_3, update_price, payment_status, invoice_requests, profiles:client_id(full_name)')
    .eq('organization_id', orgId)
    .not('invoice_requests', 'eq', '[]')
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-[20px] shadow-sm border border-black/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EFF6FF] rounded-[16px] text-[#2563EB]">
              <ReceiptText size={26} />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">
                Invoice Builder
              </h1>
              <p className="text-[#4B5563] text-sm mt-0.5">
                Buat tagihan proyek dan kelola riwayat pembayaran klien.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link 
              href="/dashboard/finance"
              className="bg-white border border-black/10 text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA] px-4 py-2.5 rounded-[12px] font-bold text-xs transition-all flex items-center justify-center shadow-sm gap-2"
            >
              <FileText size={14} /> Lihat Keuangan
            </Link>
          </div>
        </div>

        <PosLayout 
          clients={clients || []}
          projects={projects || []}
          services={services || []}
          rawInvoices={invoices || []}
          invoices={(invoices || []).map(inv => ({
            id: inv.id,
            project_id: inv.project_id ?? null,
            termin_label: (inv as any).termin_label ?? null,
            status: inv.status,
          }))}
        />
      </div>
    </div>
  )
}
