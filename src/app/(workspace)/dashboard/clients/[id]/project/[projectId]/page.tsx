import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, WalletCards, Briefcase, FileText, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientProjectHistoryPage({
  params,
}: {
  params: Promise<{ id: string, projectId: string }>
}) {
  const { id: clientId, projectId } = await params
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  const userRole = profile?.role || 'staff_digital'
  const isExecutor = ['staff_executor', 'staff_digital', 'staff_physical'].includes(userRole)

  // Ambil Data Proyek
  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles:client_id (full_name, email, whatsapp_number)')
    .eq('id', projectId)
    .single()

  if (!project) {
    redirect(`/dashboard/clients/${clientId}`)
  }

  const projectCategory = project.project_category ?? 'DIGITAL'

  // Fetch invoices & assets
  const [
    { data: invoices },
    { data: assets },
    digitalDetailsResult,
    physicalDetailsResult,
  ] = await Promise.all([
    supabase
      .from('fin_invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),

    supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),

    projectCategory === 'DIGITAL'
      ? supabase
          .from('project_digital_details')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    projectCategory === 'PHYSICAL'
      ? supabase
          .from('project_physical_details')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const digitalDetails = digitalDetailsResult.data || {}
  const physicalDetails = physicalDetailsResult.data || {}

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Tombol Kembali & Judul */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] px-4 py-2 bg-white border border-black/10 rounded-[10px] shadow-sm transition-all"
          >
            <ArrowLeft size={16} /> Kembali ke Profil Klien
          </Link>
        </div>

        {/* Header Kertas Laporan */}
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
          <div className="p-8 border-b border-black/5 bg-[#F8F9FA]/30 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-extrabold text-2xl text-[#111827]">{project.title}</h1>
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${project.status === 'completed' || project.status === 'selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {project.status === 'completed' || project.status === 'selesai' ? 'Selesai' : 'Sedang Berjalan'}
                </span>
              </div>
              <p className="text-sm font-medium text-[#4B5563]">Dibuat pada: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Tenggat Waktu</p>
              <p className="font-extrabold text-[#111827]">{project.deadline ? new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
            </div>
          </div>

          <div className={`p-8 grid grid-cols-1 ${!isExecutor ? 'md:grid-cols-2' : 'max-w-3xl'} gap-8`}>
            
            {/* KOLOM KIRI: Spesifikasi & Progress */}
            <div className="space-y-8">
              {/* Progress */}
              <div>
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-[#2563EB]" /> Progress Pengerjaan
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2563EB] rounded-full transition-all duration-1000" style={{ width: `${project.progress_percentage || 0}%` }}></div>
                  </div>
                  <span className="font-extrabold text-[#111827]">{project.progress_percentage || 0}%</span>
                </div>
              </div>

              {/* Spesifikasi */}
              <div>
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-[#2563EB]" /> Spesifikasi Proyek
                </h3>
                <div className="bg-[#F8F9FA] rounded-[12px] p-5 border border-black/5 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Kategori</p>
                    <p className="text-sm font-medium text-[#111827]">{projectCategory}</p>
                  </div>
                  
                  {projectCategory === 'DIGITAL' && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Platform / Tipe Layanan</p>
                        <p className="text-sm font-medium text-[#111827]">{digitalDetails.platform || project.service_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Catatan Kebutuhan</p>
                        <p className="text-sm font-medium text-[#111827] whitespace-pre-wrap">{digitalDetails.design_notes || 'Tidak ada catatan'}</p>
                      </div>
                    </>
                  )}

                  {projectCategory === 'PHYSICAL' && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Tipe Barang</p>
                        <p className="text-sm font-medium text-[#111827]">{physicalDetails.item_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Jumlah (Qty)</p>
                        <p className="text-sm font-medium text-[#111827]">{physicalDetails.quantity || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Alamat Pengiriman</p>
                        <p className="text-sm font-medium text-[#111827] whitespace-pre-wrap">{physicalDetails.shipping_address || 'Belum diisi'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Aset / Hasil */}
              <div>
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Download size={16} className="text-[#2563EB]" /> Hasil & Aset Pekerjaan
                </h3>
                {(!assets || assets.length === 0) ? (
                   <p className="text-sm text-[#6B7280] italic">Belum ada file yang diunggah.</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset: any) => (
                      <a key={asset.id} href={asset.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-black/10 rounded-[10px] hover:bg-[#F8F9FA] transition-colors">
                        <span className="font-bold text-sm text-[#111827]">{asset.file_name}</span>
                        <span className="text-xs font-bold text-[#2563EB]">Unduh</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: Keuangan */}
            {!isExecutor && (
              <div>
              <div className="bg-[#111827] text-white rounded-[16px] p-6 shadow-md mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <WalletCards size={80} />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">Total Nilai Proyek</h3>
                <p className="font-extrabold text-3xl mb-4">Rp {(project.total_price || 0).toLocaleString('id-ID')}</p>
                
                <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                  <span className="text-xs font-medium text-white/70">Status Pembayaran</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${project.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {project.payment_status === 'paid' ? 'LUNAS' : project.payment_status === 'partial' ? 'DIBAYAR SEBAGIAN' : 'BELUM BAYAR'}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4">Riwayat Invoice</h3>
              {(!invoices || invoices.length === 0) ? (
                 <p className="text-sm text-[#6B7280] italic">Belum ada tagihan untuk proyek ini.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="p-4 border border-black/10 rounded-[12px] bg-white hover:border-black/20 transition-all flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-[#111827]">{inv.title}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{inv.invoice_number}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-extrabold text-sm text-[#111827]">Rp {inv.amount.toLocaleString('id-ID')}</p>
                        <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider ${
                          inv.status === 'PAID' ? 'text-emerald-600' : 
                          inv.status === 'CANCELLED' ? 'text-rose-600' : 
                          'text-amber-600'
                        }`}>
                          {inv.status === 'PAID' ? 'LUNAS' : inv.status === 'CANCELLED' ? 'BATAL' : 'PENDING'}
                        </span>
                        {inv.status === 'CANCELLED' && inv.cancel_reason && (
                          <div className="text-[9px] text-rose-500 font-medium mt-1 max-w-[150px] truncate" title={inv.cancel_reason}>
                            Alasan: {inv.cancel_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
