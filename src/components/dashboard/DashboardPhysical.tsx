import { 
  LogOut, LayoutDashboard, Wallet, Users, FolderKanban, 
  TrendingUp, TrendingDown, Activity, 
  ArrowRight, CheckCircle, Package, Plus, Receipt, AlertTriangle, PenTool, Boxes,
  Wrench, FileText
} from 'lucide-react'
import Link from 'next/link'
import WebhookSettingsModal from '@/components/WebhookSettingsModal'
import DashboardChart from '@/app/(workspace)/dashboard/DashboardChart'
import DeadlineProjectsWidget from '@/app/(workspace)/dashboard/DeadlineProjectsWidget'
import FinanceFollowUpWidget from '@/app/(workspace)/dashboard/FinanceFollowUpWidget'
import { logout } from '@/app/login/actions'
import { DashboardProps } from './DashboardDigital'

export default function DashboardPhysical(props: DashboardProps) {
  const {
    orgLogoUrl, orgName, industryType, userRole, currentWebhookUrl,
    completedProjectsCount,
    totalIncome, totalReceivables, activeProjectsCount, clientsCount,
    omzetBulanIni = 0, omzetBulanLalu = 0, overdueProjectsCount = 0, lowStockItemsCount = 0,
    monthlySalesTarget = 0,
    transactions, invoices, projects, recentLogs, topClients,
    pengeluaranBulanIni = 0, pengeluaranBulanLalu = 0,
    pendingMaintenanceCount = 0, pendingProcurementCount = 0
  } = props

  // Calculate percentage diff for Omzet
  let omzetDiffPercent = 0
  if (omzetBulanLalu > 0) {
    omzetDiffPercent = ((omzetBulanIni - omzetBulanLalu) / omzetBulanLalu) * 100
  } else if (omzetBulanIni > 0) {
    omzetDiffPercent = 100
  }

  // Calculate percentage diff for Pengeluaran
  let pengeluaranDiffPercent = 0
  if (pengeluaranBulanLalu > 0) {
    pengeluaranDiffPercent = ((pengeluaranBulanIni - pengeluaranBulanLalu) / pengeluaranBulanLalu) * 100
  } else if (pengeluaranBulanIni > 0) {
    pengeluaranDiffPercent = 100
  }

  // Calculate Target Progress
  const targetProgress = monthlySalesTarget > 0 ? Math.min((omzetBulanIni / monthlySalesTarget) * 100, 100) : 0

  // Calculate Net Profit
  const labaBersih = (omzetBulanIni || 0) - (pengeluaranBulanIni || 0)
  const isProfit = labaBersih >= 0

  const hasCriticalAlerts = overdueProjectsCount > 0 || lowStockItemsCount > 0 || pendingMaintenanceCount > 0 || pendingProcurementCount > 0
  
  // ROLE CHECKS
  const isCommandCenter = ['admin', 'super_admin', 'staff_ops', 'staff_cs', 'staff_finance'].includes(userRole)
  const isWarehouse = userRole === 'staff_warehouse'
  const isProduction = userRole === 'staff_production'
  const isDesign = userRole === 'staff_design'
  const isFinanceOrAdmin = ['admin', 'super_admin', 'staff_finance', 'staff_cs'].includes(userRole)
  const isOrderCreator = ['admin', 'super_admin'].includes(userRole)

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-[#F8F9FA] to-[#F0FDF4] min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* PREMIUM HEADER - Glassmorphism */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] shadow-sm border border-white/50 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            {orgLogoUrl ? (
              <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white bg-white flex items-center justify-center shrink-0 shadow-md p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={orgLogoUrl} alt={`Logo ${orgName}`} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-[20px] text-white flex items-center justify-center shadow-md">
                <LayoutDashboard size={28} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-extrabold text-3xl text-gray-900 tracking-tight font-['Plus_Jakarta_Sans']">Dasbor</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                  {isCommandCenter ? 'Command Center' : isWarehouse ? 'Gudang' : isProduction ? 'Produksi' : isDesign ? 'Studio Desain' : industryType}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Sistem Manajemen <span className="font-bold text-gray-700">{orgName || 'Agensi'}</span></p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {/* Quick Action Buttons */}
            {isOrderCreator && (
               <Link href="/dashboard/production/new" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-all shadow-sm">
                 <Plus size={16} /> Buat Pesanan Baru
               </Link>
            )}
            {isFinanceOrAdmin && (
               <Link href="/dashboard/pos?tab=manual&action=new" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-sm">
                 <Plus size={16} /> Buat Faktur Manual
               </Link>
            )}
            
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

        {/* CRITICAL ALERTS (Only for Ops/Admin or Warehouse) */}
        {hasCriticalAlerts && (isCommandCenter || isWarehouse) && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {overdueProjectsCount > 0 && isCommandCenter && (
                 <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-4 rounded-[20px] shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                       <AlertTriangle size={24} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-rose-900">{overdueProjectsCount} Pesanan Melewati Deadline</p>
                       <p className="text-xs text-rose-700 mt-0.5">Harap periksa antrean produksi sekarang.</p>
                    </div>
                 </div>
              )}
              {lowStockItemsCount > 0 && (isCommandCenter || isWarehouse) && (
                 <Link href="/dashboard/inventory" className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-4 rounded-[20px] shadow-sm hover:bg-amber-100 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                       <Package size={24} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-amber-900">{lowStockItemsCount} Bahan Baku Hampir Habis</p>
                       <p className="text-xs text-amber-700 mt-0.5">Lakukan proses restock segera.</p>
                    </div>
                 </Link>
              )}
              {pendingMaintenanceCount > 0 && isCommandCenter && (
                 <Link href="/dashboard/production/maintenance" className="flex items-center gap-4 bg-rose-50 border border-rose-100 p-4 rounded-[20px] shadow-sm hover:bg-rose-100 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                       <Wrench size={24} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-rose-900">{pendingMaintenanceCount} Tiket Kendala Mesin Baru</p>
                       <p className="text-xs text-rose-700 mt-0.5">Butuh penanganan teknisi segera.</p>
                    </div>
                 </Link>
              )}
              {pendingProcurementCount > 0 && isCommandCenter && (
                 <Link href="/dashboard/finance/procurement" className="flex items-center gap-4 bg-blue-50 border border-blue-100 p-4 rounded-[20px] shadow-sm hover:bg-blue-100 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                       <FileText size={24} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-blue-900">{pendingProcurementCount} Pengajuan Belanja Ops</p>
                       <p className="text-xs text-blue-700 mt-0.5">Menunggu persetujuan (ACC) Keuangan.</p>
                    </div>
                 </Link>
              )}
           </div>
        )}

        {/* ROLE-BASED DASHBOARD WIDGETS */}
        
        {isWarehouse && (
          <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
             <Package size={64} className="text-emerald-500 mb-4 opacity-50" />
             <h3 className="font-extrabold text-2xl text-gray-900 mb-2">Pusat Logistik & Gudang</h3>
             <p className="text-gray-500 max-w-md mx-auto mb-6">Pantau mutasi barang masuk/keluar, dan pastikan bahan baku untuk tim produksi selalu tersedia.</p>
             <Link href="/dashboard/inventory" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors">
                Buka Manajemen Stok
             </Link>
          </div>
        )}

        {isProduction && (
          <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
             <Boxes size={64} className="text-emerald-500 mb-4 opacity-50" />
             <h3 className="font-extrabold text-2xl text-gray-900 mb-2">Antrean Produksi & Mesin</h3>
             <p className="text-gray-500 max-w-md mx-auto mb-6">Pilih pesanan yang siap cetak dan laporkan progress secara real-time ke sistem.</p>
             <Link href="/dashboard/production" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors">
                Lihat Work Orders (WIP)
             </Link>
          </div>
        )}

        {isDesign && (
          <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
             <PenTool size={64} className="text-emerald-500 mb-4 opacity-50" />
             <h3 className="font-extrabold text-2xl text-gray-900 mb-2">Studio Desain & Pre-Press</h3>
             <p className="text-gray-500 max-w-md mx-auto mb-6">Siapkan file desain (Mockup) untuk di-ACC oleh klien sebelum masuk ke tahap mesin produksi.</p>
             <Link href="/dashboard/production" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors">
                Cek Antrean Desain
             </Link>
          </div>
        )}

        {isCommandCenter && (
          <>
            {/* COMMAND CENTER METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* 1. Total Omzet Bulan Ini */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[28px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Wallet size={100} /></div>
                 <div className="flex items-center justify-between mb-6 relative z-10">
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Wallet size={18} /></div>
                     <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50">Total Omzet Bulan Ini</p>
                   </div>
                   <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${omzetDiffPercent >= 0 ? 'bg-emerald-400/30 text-emerald-50' : 'bg-rose-400/30 text-rose-50'}`}>
                      {omzetDiffPercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(omzetDiffPercent).toFixed(1)}%
                   </span>
                 </div>
                 
                 <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate mb-1">Rp {omzetBulanIni.toLocaleString('id-ID')}</p>
                 
                 {monthlySalesTarget > 0 ? (
                   <div className="mt-4 relative z-10">
                     <div className="flex justify-between text-xs font-medium text-emerald-100 mb-1.5">
                       <span>Progress Target</span>
                       <span>Rp {monthlySalesTarget.toLocaleString('id-ID')}</span>
                     </div>
                     <div className="w-full bg-black/20 rounded-full h-2">
                       <div 
                         className="bg-white rounded-full h-2 transition-all duration-1000 ease-out" 
                         style={{ width: `${targetProgress}%` }}
                       />
                     </div>
                   </div>
                 ) : (
                   <div className="mt-4 text-xs font-medium text-emerald-100 bg-black/10 p-2 rounded-lg relative z-10">
                     Target bulanan belum diatur di menu Pengaturan.
                   </div>
                 )}
              </div>

              {/* 2. Total Pengeluaran Bulan Ini */}
               <div className="bg-gradient-to-br from-rose-500 to-red-700 p-6 rounded-[28px] shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Receipt size={100} /></div>
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Receipt size={18} /></div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-rose-50">Pengeluaran Bulan Ini</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${pengeluaranDiffPercent <= 0 ? 'bg-emerald-400/30 text-emerald-50' : 'bg-rose-400/30 text-rose-50'}`}>
                       {pengeluaranDiffPercent <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                       {Math.abs(pengeluaranDiffPercent).toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate mb-1">Rp {pengeluaranBulanIni.toLocaleString('id-ID')}</p>
                  
                  <div className="mt-4 flex items-center gap-2 relative z-10">
                     <span className="text-xs text-rose-100 font-medium opacity-80">Dari operasional & belanja</span>
                  </div>
               </div>

              {/* 3. Jumlah Pesanan Aktif */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[28px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><FolderKanban size={100} /></div>
                 <div className="flex items-center gap-2 mb-6 relative z-10">
                 <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><FolderKanban size={18} /></div>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-amber-50">Pesanan Aktif</p>
                 </div>
                 <p className="text-3xl font-extrabold tracking-tight relative z-10">{activeProjectsCount} <span className="text-lg font-medium text-amber-200">diproses</span></p>
                 <div className="mt-4 flex items-center gap-2 relative z-10">
                    <span className="text-xs text-amber-100 font-medium opacity-80">Antrean Work in Progress</span>
                 </div>
              </div>
              
              {/* 3. Piutang (Total Receivables) */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[28px] shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Receipt size={100} /></div>
                 <div className="flex items-center gap-2 mb-6 relative z-10">
                 <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Receipt size={18} /></div>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Piutang Klien</p>
                 </div>
                 <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate">Rp {totalReceivables.toLocaleString('id-ID')}</p>
                 <div className="mt-4 flex items-center gap-2 relative z-10">
                    <span className="text-xs text-blue-100 font-medium opacity-80">Belum dibayar lunas</span>
                 </div>
              </div>
              
            </div>

            {/* NET PROFIT BANNER */}
            <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-6 rounded-[24px] border border-white/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isProfit ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 uppercase tracking-widest mb-1">Laba Bersih Bulan Ini</h4>
                  <p className="text-xs text-gray-500">Estimasi dari Total Omzet dikurangi Total Pengeluaran Operasional</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rp {labaBersih.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* COMMAND CENTER CHARTS & LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Charts & Leaderboards */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Chart Area */}
                {isFinanceOrAdmin && (
                  <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                    </div>
                    <div className="h-[350px]">
                      <DashboardChart transactions={transactions || []} />
                    </div>
                  </div>
                )}

                {/* Deadline / Follow Up Widget */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-sm overflow-hidden">
                   {userRole === 'staff_finance' ? (
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
                        <h3 className="font-extrabold text-lg text-gray-900">Klien & Pemasok VIP</h3>
                        <p className="text-xs text-gray-500 mt-1">Penyumbang omzet terbesar bulan ini</p>
                      </div>
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={18} /></div>
                    </div>
                    <div className="space-y-5">
                       {topClients.length > 0 ? topClients.map((c, i) => (
                         <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                               {c.name.substring(0, 1).toUpperCase()}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{c.name}</p>
                               <p className="text-[11px] text-gray-500 font-medium">Total Nilai Pesanan</p>
                             </div>
                           </div>
                           <span className="text-sm font-extrabold text-emerald-600">Rp {(c.ltv / 1000000).toFixed(1)}M</span>
                         </div>
                       )) : (
                          <div className="text-center py-6">
                             <p className="text-sm text-gray-500 font-medium">Belum ada data transaksi lunas.</p>
                          </div>
                       )}
                    </div>
                    <Link href="/dashboard/clients" className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
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
                            <h3 className="font-extrabold text-lg text-white">Log Aktivitas Terkini</h3>
                            <p className="text-xs text-gray-400 mt-1">Sistem Pemantauan Gudang & Produksi</p>
                         </div>
                         <div className="flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                      </div>
                      
                      <div className="space-y-4 relative mt-2">
                         <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-gray-700 via-gray-800 to-transparent"></div>
                         {recentLogs && recentLogs.length > 0 ? recentLogs.map((log, i) => (
                            <div key={log.id} className="relative flex gap-4 group items-start">
                               <div className="w-3 h-3 mt-1 rounded-full bg-emerald-500 border-2 border-gray-900 shrink-0 relative z-10 group-hover:scale-125 transition-transform group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                               <div className="flex-1 pb-2">
                                  <p className="text-[11px] text-gray-400 leading-snug">
                                     <span className="font-bold text-emerald-400">{log.actor_email.split('@')[0]}</span> melakukan <span className="font-bold text-gray-200">{log.action.replace('_', ' ').toLowerCase()}</span> pada <span className="font-bold text-white">{log.target_name}</span>
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
          </>
        )}

      </div>
    </div>
  )
}
