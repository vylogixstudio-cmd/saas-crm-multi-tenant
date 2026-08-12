'use client'

import { Calendar, ArrowRight, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function FinanceFollowUpWidget({ invoices }: { invoices: any[] }) {
  // Filter invoices that are pending and due date is approaching (H-5) or past due
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const followUpInvoices = invoices.filter(inv => {
    if (inv.status !== 'PENDING' && inv.status !== 'WAITING_CONFIRMATION') return false
    if (!inv.due_date) return false
    
    const dueDate = new Date(inv.due_date)
    dueDate.setHours(0, 0, 0, 0)
    
    // Calculate difference in days
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Show if due date is within 5 days or if it's already past due
    return diffDays <= 5
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  return (
    <div className="p-6 sm:p-8 bg-white/70 backdrop-blur-xl h-full flex flex-col relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Calendar size={120} />
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="font-extrabold text-xl text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
              <AlertCircle size={18} />
            </span>
            Follow Up Tagihan
          </h3>
          <p className="text-xs text-gray-500 mt-2 font-medium">Pantau pembayaran mendekati jatuh tempo (H-5)</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        {followUpInvoices.slice(0, 4).map((inv, i) => {
          const dueDate = new Date(inv.due_date)
          dueDate.setHours(0, 0, 0, 0)
          
          const diffTime = dueDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          const isLate = diffDays < 0
          
          return (
            <div key={i} className={`group/item flex items-center justify-between p-4 rounded-2xl border transition-all ${isLate ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50' : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${isLate ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{inv.profiles?.full_name || 'Klien'}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{inv.projects?.title || 'Proyek'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-gray-900">Rp {Number(inv.amount).toLocaleString('id-ID')}</p>
                <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${isLate ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
                  {isLate ? `Terlambat ${Math.abs(diffDays)} Hari` : diffDays === 0 ? 'Hari Ini!' : `H-${diffDays}`}
                </div>
              </div>
            </div>
          )
        })}
        {followUpInvoices.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3">
              <Clock size={20} />
            </div>
            <p className="text-sm font-bold text-gray-900">Semua Tagihan Aman</p>
            <p className="text-xs text-gray-500 mt-1">Tidak ada tagihan yang mendekati jatuh tempo</p>
          </div>
        )}
      </div>

      <Link 
        href="/dashboard/pos?tab=project"
        className="mt-6 w-full py-3.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 relative z-10 group/btn"
      >
        Lihat Semua Tagihan <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}
