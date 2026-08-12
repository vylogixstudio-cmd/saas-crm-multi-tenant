import { 
  LogOut, LayoutDashboard, Users, FolderKanban, 
  TrendingUp, TrendingDown, Activity, 
  ArrowRight, CheckCircle, Package, Plus, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck
} from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { DashboardProps } from './DashboardDigital'

export default function DashboardWarehouse(props: DashboardProps) {
  const {
    orgLogoUrl, orgName,
    inventoryItems = [],
    inventoryTransactions = []
  } = props

  // Hitung jumlah bahan yang stoknya menipis
  const lowStockItemsCount = inventoryItems.filter((item: any) => Number(item.current_stock) <= Number(item.min_stock_alert)).length
  const totalItemsCount = inventoryItems.length

  // Hitung total transaksi masuk (IN) bulan ini
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const inboundCountThisMonth = inventoryTransactions
    .filter((t: any) => t.type === 'IN' && new Date(t.created_at) >= currentMonthStart)
    .reduce((sum: number, t: any) => sum + Number(t.quantity), 0)

  const outboundCountThisMonth = inventoryTransactions
    .filter((t: any) => t.type === 'OUT' && new Date(t.created_at) >= currentMonthStart)
    .reduce((sum: number, t: any) => sum + Number(t.quantity), 0)

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
                <h1 className="font-extrabold text-3xl text-gray-900 tracking-tight font-['Plus_Jakarta_Sans']">Dasbor Gudang</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                  Tim Gudang
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Manajemen Stok & Logistik <span className="font-bold text-gray-700">{orgName || 'Agensi'}</span></p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link href="/dashboard/inventory/inbound" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-all shadow-sm">
              <ArrowDownToLine size={16} /> Catat Barang Masuk
            </Link>
            
            <Link href="/dashboard/inventory/outbound" className="flex items-center gap-2 text-xs font-bold text-white px-5 py-3 bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-sm">
              <ArrowUpFromLine size={16} /> Catat Pengeluaran
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
          
          {/* 1. Total Jenis Barang */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[28px] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><Package size={100} /></div>
             <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><Package size={18} /></div>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50">Total Jenis Bahan</p>
               </div>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate mb-1">{totalItemsCount} <span className="text-lg font-medium text-emerald-200">item</span></p>
             <div className="mt-4 relative z-10">
               <Link href="/dashboard/inventory" className="text-xs font-medium text-emerald-100 hover:text-white underline underline-offset-2">Kelola Master Material</Link>
             </div>
          </div>

          {/* 2. Stok Menipis */}
          <div className="bg-gradient-to-br from-rose-500 to-red-700 p-6 rounded-[28px] shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><AlertTriangle size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><AlertTriangle size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-rose-100">Peringatan Stok Habis</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10">{lowStockItemsCount} <span className="text-lg font-medium text-rose-200">item</span></p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className="text-xs text-rose-100 font-medium opacity-80">Harus segera di-restock</span>
             </div>
          </div>
          
          {/* 3. Barang Masuk Bulan Ini */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[28px] shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><ArrowDownToLine size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><ArrowDownToLine size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Volume Masuk (Bulan Ini)</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate">+{inboundCountThisMonth}</p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className="text-xs text-blue-100 font-medium opacity-80">Barang disuplai</span>
             </div>
          </div>

          {/* 4. Pengeluaran Bahan */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[28px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500"><ArrowUpFromLine size={100} /></div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-[12px] text-white"><ArrowUpFromLine size={18} /></div>
               <p className="text-[11px] font-bold uppercase tracking-widest text-amber-100">Volume Keluar (Bulan Ini)</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight relative z-10 truncate">-{outboundCountThisMonth}</p>
             <div className="mt-4 flex items-center gap-2 relative z-10">
                <span className="text-xs text-amber-100 font-medium opacity-80">Barang digunakan produksi</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INVENTORY / KETERSEDIAAN BAHAN BAKU */}
          <div className="lg:col-span-2 bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
              <h2 className="font-extrabold text-[#111827] flex items-center gap-2 text-lg">
                <Package size={20} className="text-[#059669]" /> Peringatan Stok
              </h2>
              <Link href="/dashboard/inventory" className="text-xs font-bold text-[#059669] hover:text-emerald-700">Kelola Semua</Link>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                    <th className="py-3 px-4 rounded-tl-[12px]">Nama Bahan / Kategori</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.slice(0, 5).map((item: any) => {
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
                        <p className="font-medium text-sm">Belum ada data barang.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* ACTIVITY LOG (INVENTORY) */}
          <div className="bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
              <h2 className="font-extrabold text-[#111827] flex items-center gap-2 text-lg">
                <Activity size={20} className="text-[#6366F1]" /> Log Mutasi Terakhir
              </h2>
            </div>
            <div className="p-6 flex-1">
              <div className="space-y-6">
                {inventoryTransactions.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-8 before:bottom-[-24px] before:w-[2px] before:bg-gray-100 last:before:hidden">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center shadow-sm">
                      {log.type === 'IN' && <ArrowDownToLine size={10} className="text-blue-500" />}
                      {log.type === 'OUT' && <ArrowUpFromLine size={10} className="text-amber-500" />}
                      {log.type === 'ADJUST' && <ClipboardCheck size={10} className="text-indigo-500" />}
                    </div>
                    <div className="text-xs font-bold text-gray-900 mb-1">
                      {log.type === 'IN' && 'Barang Masuk'}
                      {log.type === 'OUT' && 'Pengeluaran Bahan'}
                      {log.type === 'ADJUST' && 'Penyesuaian Stok (Opname)'}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mb-2 leading-relaxed">
                      {log.actor_name || 'Staf'} merekam mutasi sebanyak <span className="font-bold text-gray-700">{log.quantity}</span>.
                      {log.notes && <span className="block mt-1 text-gray-400">"{log.notes}"</span>}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                {inventoryTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Activity size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Belum ada riwayat mutasi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
