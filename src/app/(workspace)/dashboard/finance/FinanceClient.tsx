'use client'

import { useState, useTransition } from 'react'
import { addTransaction, addCategory } from './actions'
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function FinanceClient({ categories }: { categories: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Tab: 'transaction' | 'category'
  const [activeTab, setActiveTab] = useState<'transaction'|'category'>('transaction')

  const handleTransactionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    
    startTransition(async () => {
      const res = await addTransaction(formData)
      if (res?.error) {
        setErrorMsg(res.error)
        toast.error(res.error)
      } else {
        form.reset()
        toast.success('Transaksi berhasil dicatat!', {
          description: 'Data mutasi buku besar telah diperbarui.'
        })
      }
    })
  }

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    
    startTransition(async () => {
      const res = await addCategory(formData)
      if (res?.error) {
        setErrorMsg(res.error)
        toast.error(res.error)
      } else {
        form.reset()
        toast.success('Kategori berhasil dibuat!', {
          description: 'Sekarang Anda bisa menggunakannya saat mencatat transaksi.'
        })
        setActiveTab('transaction')
      }
    })
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/50">
        <h2 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
          <Wallet size={20} className="text-[#2563EB]" />
          Kelola Keuangan
        </h2>
      </div>

      <div className="flex border-b border-black/5">
        <button 
          onClick={() => setActiveTab('transaction')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'transaction' ? 'text-[#2563EB] border-b-2 border-[#2563EB] bg-[#EFF6FF]/50' : 'text-[#4B5563] hover:bg-[#F8F9FA]'}`}
        >
          Catat Transaksi
        </button>
        <button 
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'category' ? 'text-[#2563EB] border-b-2 border-[#2563EB] bg-[#EFF6FF]/50' : 'text-[#4B5563] hover:bg-[#F8F9FA]'}`}
        >
          + Kategori Baru
        </button>
      </div>

      <div className="p-6">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-[8px] border border-rose-100">
            {errorMsg}
          </div>
        )}

        {activeTab === 'transaction' ? (
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="type" value="INCOME" className="peer sr-only" defaultChecked />
                <div className="flex items-center gap-2 p-3 bg-[#F8F9FA] border border-black/10 rounded-[10px] peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all">
                  <ArrowDownCircle size={15} /> <span className="text-xs font-bold">Pemasukan</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="type" value="EXPENSE" className="peer sr-only" />
                <div className="flex items-center gap-2 p-3 bg-[#F8F9FA] border border-black/10 rounded-[10px] peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-700 transition-all">
                  <ArrowUpCircle size={15} /> <span className="text-xs font-bold">Pengeluaran</span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Kategori</label>
              {categories.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] text-xs text-amber-700 font-medium">
                  Belum ada kategori.{' '}
                  <button type="button" onClick={() => setActiveTab('category')} className="font-bold underline">
                    Buat kategori dulu →
                  </button>
                </div>
              ) : (
                <select name="category_id" required className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20">
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type === 'INCOME' ? '+' : '-'})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9CA3AF]">Rp</span>
                <input type="number" name="amount" min="1" required placeholder="500.000" className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Keterangan</label>
              <input type="text" name="description" required placeholder="Keterangan singkat..." className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </div>

            <button disabled={isPending} type="submit" className="w-full py-3 bg-[#111827] hover:bg-black text-white font-bold text-sm rounded-[12px] shadow-sm transition-all flex items-center justify-center gap-2">
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Simpan Transaksi
            </button>
          </form>
        ) : (
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-[10px] text-xs text-blue-700 font-medium">
              💡 Kategori membantu mengelompokkan transaksi (misal: Gaji, Listrik, Pemasukan Proyek).
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Tipe Kategori</label>
              <select name="type" required className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20">
                <option value="INCOME">Pemasukan (+)</option>
                <option value="EXPENSE">Pengeluaran (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Nama Kategori</label>
              <input type="text" name="name" required placeholder="Contoh: Gaji Tim, Listrik, Bonus..." className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
            </div>

            <button disabled={isPending} type="submit" className="w-full py-3 bg-[#111827] hover:bg-black text-white font-bold text-sm rounded-[12px] shadow-sm transition-all flex items-center justify-center gap-2">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Buat Kategori
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
