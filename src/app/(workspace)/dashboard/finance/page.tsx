import { createClient } from '@/utils/supabase/server'
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, WalletCards, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import FinanceClient from './FinanceClient'

export default async function FinancePage() {
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

  // Ambil transaksi — batasi 100 terbaru
  const { data: transactions } = await supabase
    .from('fin_transactions')
    .select(`
      *,
      fin_categories (name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: categories } = await supabase
    .from('fin_categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  // Hitung saldo
  let income = 0
  let expense = 0
  
  if (transactions) {
    transactions.forEach(t => {
      if (t.type === 'INCOME') income += Number(t.amount)
      else if (t.type === 'EXPENSE') expense += Number(t.amount)
    })
  }

  const balance = income - expense
  const isPositive = balance >= 0

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-[20px] shadow-sm border border-black/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EFF6FF] rounded-[16px] text-[#2563EB]">
              <WalletCards size={26} />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">
                Keuangan & Buku Besar
              </h1>
              <p className="text-[#4B5563] text-sm mt-0.5">
                Laporan kas masuk dan keluar agensi Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-[20px] shadow-sm border flex items-center justify-between ${isPositive ? 'bg-white border-black/5' : 'bg-rose-50 border-rose-100'}`}>
            <div>
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1">Saldo Kas</p>
              <h2 className={`text-2xl font-extrabold ${isPositive ? 'text-[#111827]' : 'text-rose-600'}`}>
                Rp {Math.abs(balance).toLocaleString('id-ID')}
              </h2>
              <p className={`text-[10px] font-bold mt-1 ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isPositive ? '▲ Surplus' : '▼ Defisit'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-blue-50 text-[#2563EB]' : 'bg-rose-100 text-rose-600'}`}>
              <DollarSign size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1">Total Pemasukan</p>
              <h2 className="text-2xl font-extrabold text-emerald-600">Rp {income.toLocaleString('id-ID')}</h2>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">
                {transactions?.filter(t => t.type === 'INCOME').length || 0} transaksi
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <ArrowDownRight size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1">Total Pengeluaran</p>
              <h2 className="text-2xl font-extrabold text-rose-600">Rp {expense.toLocaleString('id-ID')}</h2>
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                {transactions?.filter(t => t.type === 'EXPENSE').length || 0} transaksi
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Kiri */}
          <div className="lg:col-span-2">
            <FinanceClient categories={categories || []} />
          </div>

          {/* Tabel Mutasi Kanan */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[20px] shadow-sm border border-black/5 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
                <h2 className="font-extrabold text-lg text-[#111827]">
                  Mutasi Buku Besar
                </h2>
                <span className="text-xs font-bold text-[#9CA3AF]">
                  {transactions?.length || 0} catatan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Keterangan & Kategori</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.map(t => (
                      <tr key={t.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3.5 px-4 text-xs font-medium text-[#6B7280] whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          <br/>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#111827] text-sm">{t.description}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mt-0.5">
                            {(t as any).fin_categories?.name || 'Tanpa Kategori'}
                          </div>
                        </td>
                        <td className={`py-3.5 px-4 text-right font-extrabold text-sm whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} Rp {Number(t.amount).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    
                    {(!transactions || transactions.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-16 text-center">
                          <WalletCards size={36} className="mx-auto text-[#D1D5DB] mb-3" />
                          <p className="text-[#9CA3AF] font-semibold text-sm">Belum ada catatan mutasi.</p>
                          <p className="text-[#D1D5DB] text-xs mt-1">Catat transaksi pertama dari form di sebelah kiri.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
