import { 
  LogOut, LayoutDashboard, Wallet, Users, FolderKanban, 
  TrendingUp, TrendingDown, Activity, 
  ArrowRight, CheckCircle, Package, Plus, Receipt, AlertTriangle, PenTool, Boxes
} from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { DashboardProps } from './DashboardDigital'

export default function DashboardCS(props: DashboardProps) {
  const {
    orgLogoUrl, orgName,
    totalReceivables, activeProjectsCount,
    omzetBulanIni = 0, omzetBulanLalu = 0, overdueProjectsCount = 0,
    monthlySalesTarget = 0, totalExpense = 0,
    inventoryItems = []
  } = props

  // Calculate percentage diff for Omzet
  let omzetDiffPercent = 0
  if (omzetBulanLalu > 0) {
    omzetDiffPercent = ((omzetBulanIni - omzetBulanLalu) / omzetBulanLalu) * 100
  } else if (omzetBulanIni > 0) {
    omzetDiffPercent = 100
  }

  // Calculate Target Progress
  const targetProgress = monthlySalesTarget > 0 ? Math.min((omzetBulanIni / monthlySalesTarget) * 100, 100) : 0

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-[#F8F9FA] to-[#F0FDF4] min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* PREMIUM HEADER - Glassmorphism */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] shadow-sm border border-white/50 relative overflow-hidden">
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
                  Customer Service
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Sistem Manajemen <span className="font-bold text-gray-700">{orgName || 'Agensi'}</span></p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link href="/dashboard/production/new" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-all shadow-sm">
              <Plus size={16} /> Buat Pesanan Baru
            </Link>
            
            <Link href="/dashboard/pos?tab=manual&action=new" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-sm">
              <Plus size={16} /> Buat Faktur Manual
            </Link>
            
            <form action={logout}>
              <button type="submit" className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-rose-600 px-5 py-3 bg-white border border-gray-200 rounded-full hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm">
                <LogOut size={16} /> Logout
              </button>
            </form>
          </div>
        </div>

        {/* METRICS WIDGETS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* 1. Target Penjualan & Omzet */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[28px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Wallet size={100} /></div>
             <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Wallet size={18} /></div>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50">Omzet Bulan Ini</p>
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

          {/* 2. Jumlah Pesanan Aktif */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[28px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><FolderKanban size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><FolderKanban size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-amber-50">Pesanan Aktif</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10">{activeProjectsCount} <span className="text-lg font-medium text-amber-200">pesanan</span></p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className="text-xs text-amber-100 font-medium opacity-80">Pesanan sedang diproses di produksi</span>
             </div>
          </div>
          
          {/* 3. Piutang (Total Receivables) */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[28px] shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Receipt size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Receipt size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Piutang Klien (Pending)</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate">Rp {totalReceivables.toLocaleString('id-ID')}</p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <Link href="/dashboard/pos" className="text-xs text-blue-100 font-medium opacity-100 hover:text-white underline underline-offset-2">Follow-up Tagihan</Link>
             </div>
          </div>
          
          {/* 4. Pengeluaran Keuangan */}
          <div className="bg-gradient-to-br from-rose-500 to-red-700 p-6 rounded-[28px] shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><TrendingDown size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><TrendingDown size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-rose-100">Pengeluaran Keuangan</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate">Rp {totalExpense.toLocaleString('id-ID')}</p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className="text-xs text-rose-100 font-medium opacity-80">Total seluruh biaya keluar</span>
             </div>
          </div>
        </div>

        {/* INVENTORY / KETERSEDIAAN BAHAN BAKU */}
        <div className="bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
            <h2 className="font-extrabold text-[#111827] flex items-center gap-2 text-lg">
              <Package size={20} className="text-[#059669]" /> Ketersediaan Bahan Baku
            </h2>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-[#059669] hover:text-emerald-700">Lihat Modul Gudang</Link>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                  <th className="py-3 px-4 rounded-tl-[12px]">Nama Bahan / Kategori</th>
                  <th className="py-3 px-4">Sisa Stok</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item: any) => {
                  const isLow = Number(item.current_stock) <= Number(item.min_stock_alert)
                  return (
                    <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#111827]">{item.name}</div>
                        <div className="text-xs font-medium text-[#4B5563] mt-1">{item.category}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`font-bold ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>{item.current_stock}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-500">{item.unit}</div>
                      </td>
                      <td className="py-4 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle size={12} /> Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} /> Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {inventoryItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#4B5563]">
                      <Package size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-sm">Data stok bahan baku belum ditambahkan atau modul gudang belum diaktifkan.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
