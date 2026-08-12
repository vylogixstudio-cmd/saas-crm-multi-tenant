'use client'

import { useState } from 'react'
import { Plus, X, Globe, Package, Sparkles } from 'lucide-react'
import { createClientProject } from '@/app/(workspace)/dashboard/actions'
import { createPhysicalOrder } from '@/app/(workspace)/dashboard/production/actions'
import CurrencyInput from '@/components/CurrencyInput'
import { toast } from 'sonner'

interface AgencyService {
  id: string
  name: string
  organization_id: string
}

interface ClientProfile {
  id: string
  full_name: string
  email: string
}

export default function CreateHybridProjectModal({ 
  clients = [], 
  services = [] 
}: { 
  clients: ClientProfile[]
  services?: AgencyService[] 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [orderType, setOrderType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleDigitalSubmit(formData: FormData) {
    setLoading(true)
    setErrorMsg('')
    
    const res = await createClientProject(formData)
    
    if (res?.error) {
      setErrorMsg(res.error)
      toast.error(res.error)
      setLoading(false)
    } else {
      toast.success('Proyek Digital baru berhasil dibuat!')
      setIsOpen(false)
      setLoading(false)
    }
  }

  async function handlePhysicalSubmit(formData: FormData) {
    setLoading(true)
    setErrorMsg('')

    const res = await createPhysicalOrder(formData)

    if (res && !res.success) {
      const err = res.error || 'Gagal membuat pesanan fisik'
      setErrorMsg(err)
      toast.error(err)
      setLoading(false)
    } else {
      toast.success('Pesanan Fisik baru berhasil dibuat & masuk antrean!')
      setIsOpen(false)
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => {
          setErrorMsg('')
          setIsOpen(true)
        }}
        className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold px-4 py-2 rounded-[12px] text-xs hover:opacity-95 transition-all shadow-sm"
      >
        <Plus size={16} /> Buat Proyek / Pesanan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden border border-black/5 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black uppercase tracking-wider">
                    Hybrid Workspace
                  </span>
                </div>
                <h2 className="font-extrabold text-xl text-[#111827] font-['Plus_Jakarta_Sans']">
                  Tambah Proyek / Pesanan Baru
                </h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/80 border border-black/5 flex items-center justify-center text-[#4B5563] hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Division Selector Tab */}
            <div className="p-4 bg-gray-50/80 border-b border-black/5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200/60 rounded-[14px]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('')
                    setOrderType('DIGITAL')
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-extrabold transition-all ${
                    orderType === 'DIGITAL'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe size={15} /> Layanan Digital / Web
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('')
                    setOrderType('PHYSICAL')
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-extrabold transition-all ${
                    orderType === 'PHYSICAL'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package size={15} /> Pesanan Fisik / Cetak
                </button>
              </div>
            </div>

            {/* FORM 1: DIGITAL PROJECT */}
            {orderType === 'DIGITAL' && (
              <form action={handleDigitalSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Pilih Klien *</label>
                  <select name="clientId" required className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors font-medium">
                    <option value="">-- Pilih Klien Terdaftar --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Judul Proyek Digital *</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    placeholder="Contoh: Pembuatan Website Toko Online" 
                    className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Tipe Jasa Layanan</label>
                  <select name="serviceType" required className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors font-medium">
                    <option value="">-- Pilih Tipe Jasa --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    {services.length === 0 && (
                      <option value="Website Development">Website Development</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CurrencyInput name="totalPrice" label="Total Nilai Kontrak (Rp)" />
                  <CurrencyInput name="dpPaid" label="DP Dibayar (Rp)" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Tenggat Waktu (Deadline Target)</label>
                  <input type="date" name="deadline" className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-[#2563EB] transition-colors font-medium" />
                </div>

                {errorMsg && (
                  <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-[12px] border border-rose-100 text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    disabled={loading} 
                    type="submit" 
                    className="w-full bg-[#2563EB] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#1D4ED8] transition-all shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? 'Menyimpan Proyek...' : 'Simpan Proyek Digital'}
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: PHYSICAL ORDER */}
            {orderType === 'PHYSICAL' && (
              <form action={handlePhysicalSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Pilih Klien *</label>
                  <select name="client_id" required className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors font-medium">
                    <option value="">-- Pilih Klien Terdaftar --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Judul Pesanan Fisik *</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    placeholder="Contoh: Cetak 100 Kaos Polo Bordir + Spanduk" 
                    className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Jenis Produk / Item *</label>
                    <input 
                      type="text" 
                      name="item_type" 
                      required 
                      placeholder="Misal: Spanduk / Kaos / Box" 
                      className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Jumlah (Qty) *</label>
                    <input 
                      type="number" 
                      name="quantity" 
                      min="1" 
                      defaultValue="1" 
                      required 
                      className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Bahan / Material</label>
                    <input 
                      type="text" 
                      name="material_notes" 
                      placeholder="Misal: Flexi Korea 340gr" 
                      className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Ukuran / Dimensi</label>
                    <input 
                      type="text" 
                      name="size_notes" 
                      placeholder="Misal: 3 x 1 Meter / Ukuran L" 
                      className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Total Harga Pesanan (Rp) *</label>
                    <input 
                      type="number" 
                      name="total_price" 
                      required 
                      placeholder="Rp 0" 
                      className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Deadline Selesai Produksi</label>
                    <input type="date" name="production_deadline" className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Alur Desain Awal</label>
                  <select name="design_flow" className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors font-medium">
                    <option value="briefing">Perlu Dibuatkan Desain (Masuk Antrean Desainer)</option>
                    <option value="ready_print">File Sudah Siap Cetak (Langsung Masuk Produksi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">Alamat Pengiriman (Opsional)</label>
                  <textarea name="shipping_address" rows={2} placeholder="Alamat lengkap penerima / ekspedisi..." className="w-full px-4 py-3 rounded-[12px] bg-[#F8F9FA] border border-black/10 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none" />
                </div>

                {errorMsg && (
                  <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-[12px] border border-rose-100 text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    disabled={loading} 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-3.5 rounded-[12px] hover:opacity-95 transition-all shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? 'Menyimpan Pesanan...' : 'Simpan Pesanan Fisik'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  )
}
