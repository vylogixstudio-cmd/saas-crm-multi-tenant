import { 
  LogOut, LayoutDashboard, Wallet, Users, FolderKanban, 
  Receipt, TrendingUp, TrendingDown, Activity, 
  ArrowRight, CheckCircle, Wrench
} from 'lucide-react'
import Link from 'next/link'
import WebhookSettingsModal from '@/components/WebhookSettingsModal'
import DashboardChart from '@/app/(workspace)/dashboard/DashboardChart'
import DeadlineProjectsWidget from '@/app/(workspace)/dashboard/DeadlineProjectsWidget'
import FinanceFollowUpWidget from '@/app/(workspace)/dashboard/FinanceFollowUpWidget'
import { logout } from '@/app/login/actions'
import { DashboardProps } from './DashboardDigital'

export default function DashboardHybrid(props: DashboardProps) {
  const {
    orgLogoUrl, orgName, industryType, userRole, currentWebhookUrl,
    isExecutor, isFinanceOrAdmin, isOpsOrAdmin,
    totalProjectsCount, completedProjectsCount, updateProjectsCount,
    totalIncome, totalReceivables, activeProjectsCount, clientsCount,
    transactions, invoices, projects, recentLogs, topClients
  } = props

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-[#F8F9FA] to-[#FDF4FF] min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PREMIUM HEADER - Glassmorphism */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] shadow-sm border border-white/50 relative overflow-hidden">
          {/* Decorative Glow - Hybrid Theme (Fuchsia) */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            {orgLogoUrl ? (
              <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white bg-white flex items-center justify-center shrink-0 shadow-md p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={orgLogoUrl} alt={`Logo ${orgName}`} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-fuchsia-600 rounded-[20px] text-white flex items-center justify-center shadow-md">
                <LayoutDashboard size={28} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-extrabold text-3xl text-gray-900 tracking-tight font-['Plus_Jakarta_Sans']">Overview</h1>
                <span className="px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-[10px] font-black uppercase tracking-widest border border-fuchsia-100 shadow-sm">
                  HYBRID AGENCY
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Sistem Manajemen <span className="font-bold text-gray-700">{orgName || 'Agensi'}</span></p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {['super_admin', 'admin'].includes(userRole) && (
              <WebhookSettingsModal currentUrl={currentWebhookUrl} />
            )}
            <form action={logout}>
              <button type="submit" className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-rose-600 px-5 py-3 bg-white border border-gray-200 rounded-full hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm">
                <LogOut size={16} /> Logout
              </button>
            </form>
          </div>
        </div>

        {/* HIGH IMPACT METRICS - Colorful Vibrant Cards */}
        {isExecutor ? (
          /* ── EXECUTOR DASHBOARD: 3 Dedicated Metrics ── */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-6 rounded-[28px] shadow-lg shadow-fuchsia-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><FolderKanban size={100} /></div>
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><FolderKanban size={18} /></div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-100">Total Proyek & Pesanan</p>
              </div>
              <p className="text-3xl font-extrabold tracking-tight relative z-10">{totalProjectsCount} <span className="text-lg font-medium text-fuchsia-200">total</span></p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[28px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><CheckCircle size={100} /></div>
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><CheckCircle size={18} /></div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50">Selesai</p>
              </div>
              <p className="text-3xl font-extrabold tracking-tight relative z-10">{completedProjectsCount} <span className="text-lg font-medium text-emerald-200">selesai</span></p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[28px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Wrench size={100} /></div>
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Wrench size={18} /></div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-50">Dalam Proses</p>
              </div>
              <p className="text-3xl font-extrabold tracking-tight relative z-10">{updateProjectsCount} <span className="text-lg font-medium text-amber-200">proses</span></p>
            </div>
          </div>
        ) : (
          /* ── NON-EXECUTOR DASHBOARD: Finance + Ops + Admin Metrics ── */
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFinanceOrAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 sm:gap-6`}>
            
            {isFinanceOrAdmin && (
              <>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[28px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Wallet size={100} /></div>
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><TrendingUp size={18} /></div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50">Total Pendapatan</p>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight relative z-10">Rp {totalIncome.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[28px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Receipt size={100} /></div>
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><TrendingDown size={18} /></div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-50">Piutang Klien (Pending)</p>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight relative z-10">Rp {totalReceivables.toLocaleString('id-ID')}</p>
                </div>
              </>
            )}

            {isOpsOrAdmin && (
              <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-6 rounded-[28px] shadow-lg shadow-fuchsia-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><FolderKanban size={100} /></div>
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><FolderKanban size={18} /></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-100">Total Aktif</p>
                </div>
                <p className="text-3xl font-extrabold tracking-tight relative z-10">{activeProjectsCount} <span className="text-lg font-medium text-fuchsia-200">total</span></p>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[28px] shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Users size={100} /></div>
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Users size={18} /></div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-100">Total Klien CRM</p>
              </div>
              <p className="text-3xl font-extrabold tracking-tight relative z-10">{clientsCount || 0} <span className="text-lg font-medium text-indigo-200">klien</span></p>
            </div>
          </div>
        )}

        {/* DUAL DIVISION OVERVIEW: DIGITAL & PHYSICAL COMMAND CARDS */}
        {isOpsOrAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DIGITAL DIVISION CARD */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-blue-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-[14px]">
                    <FolderKanban size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Divisi Layanan Digital</h3>
                    <p className="text-xs text-gray-500">Website, Software & Desain UI/UX</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-100">
                  DIGITAL OPS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-blue-50/50 p-3.5 rounded-[16px] border border-blue-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Proyek Aktif</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {(projects || []).filter(p => p.project_category !== 'PHYSICAL' && p.status !== 'completed' && p.status !== 'selesai').length}
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-3.5 rounded-[16px] border border-emerald-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Selesai</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {(projects || []).filter(p => p.project_category !== 'PHYSICAL' && (p.status === 'completed' || p.status === 'selesai')).length}
                  </p>
                </div>
                <div className="bg-purple-50/50 p-3.5 rounded-[16px] border border-purple-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total Order</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {(projects || []).filter(p => p.project_category !== 'PHYSICAL').length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs">
                <Link href="/dashboard/projects" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                  Buka Proyek Aktif <ArrowRight size={13} />
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/dashboard/infrastructure" className="text-gray-500 font-medium hover:text-gray-900">
                  Domain & Server
                </Link>
              </div>
            </div>

            {/* PHYSICAL DIVISION CARD */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-orange-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-[14px]">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Divisi Percetakan & Fisik</h3>
                    <p className="text-xs text-gray-500">Lantai Produksi, Stok & Logistik</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-extrabold rounded-full border border-orange-100">
                  PHYSICAL OPS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-orange-50/50 p-3.5 rounded-[16px] border border-orange-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Antrean Produksi</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {(projects || []).filter(p => p.project_category === 'PHYSICAL' && p.status !== 'completed' && p.status !== 'delivered').length}
                  </p>
                </div>
                <div className="bg-amber-50/50 p-3.5 rounded-[16px] border border-amber-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Stok Menipis</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {props.lowStockItemsCount || 0}
                  </p>
                </div>
                <div className="bg-rose-50/50 p-3.5 rounded-[16px] border border-rose-100/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Kendala Mesin</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-1">
                    {props.pendingMaintenanceCount || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs">
                <Link href="/dashboard/production" className="text-orange-600 font-bold hover:underline flex items-center gap-1">
                  Lantai Produksi <ArrowRight size={13} />
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/dashboard/inventory" className="text-gray-500 font-medium hover:text-gray-900">
                  Gudang & Stok
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/dashboard/shipping" className="text-gray-500 font-medium hover:text-gray-900">
                  Pengiriman / Resi
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Charts & Leaderboards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Chart Area */}
            {isFinanceOrAdmin && (
              <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900">Arus Kas (Cash Flow)</h3>
                    <p className="text-xs text-gray-500 mt-1">Pergerakan finansial bulan ini</p>
                  </div>
                </div>
                <div className="h-[350px]">
                  <DashboardChart transactions={transactions || []} />
                </div>
              </div>
            )}

            {/* Deadline / Follow Up Widget */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-sm overflow-hidden">
               {userRole === 'staff_finance' || userRole === 'staff_cs' ? (
                 <FinanceFollowUpWidget invoices={invoices || []} />
               ) : (
                 <DeadlineProjectsWidget projects={projects || []} />
               )}
            </div>

          </div>

          {/* RIGHT COLUMN: Activity & Top Clients */}
          <div className="flex flex-col gap-6">
            
            {/* VIP Clients */}
            {isFinanceOrAdmin && (
              <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-900">{(userRole === 'staff_finance' || userRole === 'staff_cs') ? 'Daftar Tunggakan' : 'Klien VIP'}</h3>
                    <p className="text-xs text-gray-500 mt-1">{(userRole === 'staff_finance' || userRole === 'staff_cs') ? 'Klien dengan tagihan pending' : 'Penyumbang omset terbesar'}</p>
                  </div>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users size={18} /></div>
                </div>
                <div className="space-y-5">
                  {(userRole === 'staff_finance' || userRole === 'staff_cs') ? (
                    // Finance/CS simplified view
                    (invoices || []).filter(inv => inv.status === 'PENDING' || inv.status === 'WAITING_CONFIRMATION').slice(0, 5).map((inv, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            {(inv.profiles?.full_name || 'K').substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{inv.profiles?.full_name}</p>
                            <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{inv.projects?.title}</p>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-rose-600">Rp {(Number(inv.amount) / 1000000).toFixed(1)}M</span>
                      </div>
                    ))
                  ) : (
                    // Normal VIP view
                    topClients.length > 0 ? topClients.map((c, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            {c.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{c.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium">Total Nilai Keseluruhan</p>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-600">Rp {(c.ltv / 1000000).toFixed(1)}M</span>
                      </div>
                    )) : (
                       <div className="text-center py-6">
                          <p className="text-sm text-gray-500 font-medium">Belum ada data transaksi lunas.</p>
                       </div>
                    )
                  )}
                  {(userRole === 'staff_finance' || userRole === 'staff_cs') && (invoices || []).filter(inv => inv.status === 'PENDING').length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 font-medium">Tidak ada tunggakan berjalan.</p>
                    </div>
                  )}
                </div>
                <Link href="/dashboard/clients" className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-xl transition-colors">
                  Lihat Semua Klien <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* Live Activity Stream */}
            <div className="bg-gray-900 p-6 sm:p-8 rounded-[32px] shadow-xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={120} /></div>
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h3 className="font-extrabold text-lg text-white">Live Activity</h3>
                        <p className="text-xs text-gray-400 mt-1">Aktivitas terbaru di sistem</p>
                     </div>
                     <div className="flex items-center justify-center w-2 h-2 rounded-full bg-fuchsia-400 animate-ping"></div>
                  </div>
                  
                  <div className="space-y-4 relative mt-2">
                     <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-gray-700 via-gray-800 to-transparent"></div>
                     {recentLogs && recentLogs.length > 0 ? recentLogs.map((log, i) => (
                        <div key={log.id} className="relative flex gap-4 group items-start">
                           <div className="w-3 h-3 mt-1 rounded-full bg-fuchsia-500 border-2 border-gray-900 shrink-0 relative z-10 group-hover:scale-125 transition-transform group-hover:bg-fuchsia-400 group-hover:shadow-[0_0_8px_rgba(217,70,239,0.6)]"></div>
                           <div className="flex-1 pb-2">
                              <p className="text-[11px] text-gray-400 leading-snug">
                                 <span className="font-bold text-fuchsia-400">{log.actor_email.split('@')[0]}</span> melakukan <span className="font-bold text-gray-200">{log.action.replace('_', ' ').toLowerCase()}</span> pada <span className="font-bold text-white">{log.target_name}</span>
                              </p>
                              <p className="text-[9px] text-gray-500 font-mono mt-1">
                                 {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                     )) : (
                        <p className="text-xs text-gray-500 text-center py-4">Belum ada aktivitas terekam.</p>
                     )}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
