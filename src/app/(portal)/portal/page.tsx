import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, Clock, CheckCircle2, AlertCircle, Package, 
  Globe, Truck, ExternalLink, Sparkles 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PortalHomePage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, title, service_type, status, progress_percentage, deadline, total_price,
      payment_status, project_category, created_at,
      project_digital_details (domain_name, preview_url, platform),
      project_physical_details (item_type, quantity, material_notes, shipping_courier, tracking_number, shipping_status, shipping_address)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  // Separate active vs completed projects
  const activeProjects = (projects || []).filter(p => !['completed', 'selesai'].includes(p.status))
  const completedProjects = (projects || []).filter(p => ['completed', 'selesai'].includes(p.status))

  const hasDigital = (projects || []).some(p => p.project_category !== 'PHYSICAL')
  const hasPhysical = (projects || []).some(p => p.project_category === 'PHYSICAL')
  const isHybridClient = hasDigital && hasPhysical

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      briefing: 'Briefing',
      design: 'Desain',
      development: 'Pengembangan',
      revision: 'Sedang Direvisi',
      revision_pending: 'Menunggu Revisi',
      production: 'Produksi',
      production_in_progress: 'Sedang Produksi',
      finishing: 'Finishing',
      qc_pending: 'Quality Control',
      packing_completed: 'Siap Kirim',
      ready_to_ship: 'Siap Kirim',
      shipped: 'Dalam Perjalanan',
      completed: 'Selesai',
      selesai: 'Selesai',
    }
    return map[status] || status
  }

  function getStatusColor(status: string) {
    if (['completed', 'selesai'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (['revision_pending', 'revision'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-100'
    if (['shipped', 'production_in_progress'].includes(status)) return 'bg-blue-50 text-blue-700 border-blue-100'
    return 'bg-gray-50 text-gray-600 border-gray-100'
  }

  const isOverdue = (deadline: string | null) => deadline ? new Date(deadline) < new Date() : false

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
            {isHybridClient ? 'Portal Klien Terpadu (Hybrid)' : 'Portal Klien'}
          </span>
        </div>
        <h1 className="font-extrabold text-2xl text-gray-900 font-['Plus_Jakarta_Sans']">
          Pesanan & Proyek Saya
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pantau progress pengerjaan digital, antrean produksi cetak, dan tracking pengiriman resi Anda.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><Clock size={18} className="text-blue-500" /></div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{activeProjects.length}</p>
              <p className="text-xs font-medium text-gray-400">Proyek / Pesanan Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle2 size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{completedProjects.length}</p>
              <p className="text-xs font-medium text-gray-400">Pesanan Selesai</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><AlertCircle size={18} className="text-amber-500" /></div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">
                {activeProjects.filter(p => isOverdue(p.deadline)).length}
              </p>
              <p className="text-xs font-medium text-gray-400">Perlu Perhatian / Deadline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-extrabold text-lg text-gray-900">Pesanan Sedang Berjalan</h2>
          <div className="flex flex-col gap-4">
            {activeProjects.map(proj => {
              const isPhys = proj.project_category === 'PHYSICAL'
              const pd = Array.isArray(proj.project_physical_details) ? proj.project_physical_details[0] : proj.project_physical_details
              const dd = Array.isArray(proj.project_digital_details) ? proj.project_digital_details[0] : proj.project_digital_details

              return (
                <Link
                  key={proj.id}
                  href={`/portal/project/${proj.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        {isPhys ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md border border-orange-200 flex items-center gap-1">
                            <Package size={11} /> Pesanan Fisik
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex items-center gap-1">
                            <Globe size={11} /> Layanan Digital
                          </span>
                        )}

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getStatusColor(proj.status)}`}>
                          {getStatusLabel(proj.status)}
                        </span>
                        
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                          {proj.service_type}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                        {proj.title}
                      </h3>

                      {/* Detail spesifik per tipe */}
                      {isPhys && pd && (
                        <p className="text-xs font-semibold text-orange-600 mt-1.5 flex items-center gap-1">
                          <Package size={13} /> {pd.quantity || 1} Pcs {pd.item_type || ''} {pd.material_notes ? `(${pd.material_notes})` : ''}
                        </p>
                      )}

                      {!isPhys && dd?.domain_name && (
                        <p className="text-xs font-semibold text-blue-600 mt-1.5 flex items-center gap-1">
                          <Globe size={13} /> Domain: {dd.domain_name}
                        </p>
                      )}

                      {proj.deadline && (
                        <p className={`text-xs font-medium mt-1.5 ${isOverdue(proj.deadline) ? 'text-rose-500' : 'text-gray-400'}`}>
                          Target Selesai: {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {isOverdue(proj.deadline) && ' ⚠️'}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4 max-w-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress Pengerjaan</span>
                          <span className="text-xs font-extrabold text-gray-900">{proj.progress_percentage || 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPhys 
                                ? 'bg-gradient-to-r from-orange-400 to-amber-500' 
                                : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                            }`}
                            style={{ width: `${proj.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                        proj.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {proj.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        <span>Buka Detail</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            Riwayat Pesanan Selesai & Terkirim
          </h2>
          <div className="flex flex-col gap-3">
            {completedProjects.map(proj => {
              const isPhys = proj.project_category === 'PHYSICAL'
              const pd = Array.isArray(proj.project_physical_details) ? proj.project_physical_details[0] : proj.project_physical_details

              return (
                <Link
                  key={proj.id}
                  href={`/portal/project/${proj.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPhys ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-200">Fisik</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Digital</span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">{proj.service_type}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{proj.title}</h3>
                    {isPhys && pd?.tracking_number && (
                      <p className="text-[11px] font-mono text-gray-500 mt-1 flex items-center gap-1">
                        <Truck size={12} className="text-orange-600" /> {pd.shipping_courier || 'Kurir'} (Resi: <strong className="text-gray-800">{pd.tracking_number}</strong>)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">Selesai</span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(projects || []).length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Package size={32} className="text-gray-300" />
            </div>
          </div>
          <h3 className="font-extrabold text-gray-900 mb-1">Belum ada pesanan</h3>
          <p className="text-sm text-gray-400">Proyek atau pesanan Anda akan tampil di sini setelah dibuat oleh agensi.</p>
        </div>
      )}
    </div>
  )
}

