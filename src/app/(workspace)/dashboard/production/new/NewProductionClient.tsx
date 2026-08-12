'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, ArrowLeft, Save, AlertCircle, ReceiptText } from 'lucide-react'
import Link from 'next/link'
import CurrencyInput from '@/components/CurrencyInput'
import { createPhysicalOrder } from '../actions'
import CreateClientModal from '@/components/CreateClientModal'

export default function NewProductionClient({ clients, services }: { clients: any[], services: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await createPhysicalOrder(formData)
    
    if (res.success) {
      if (res.invoiceId) {
        router.push(`/dashboard/pos/invoice/${res.invoiceId}`)
      } else {
        router.push('/dashboard/production')
      }
    } else {
      setError(res.error || 'Terjadi kesalahan sistem.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
         <Link href="/dashboard/production" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all border border-gray-200">
            <ArrowLeft size={20} />
         </Link>
         <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
               Buat Pesanan Fisik Baru
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Form input untuk pesanan ke tim produksi.</p>
         </div>
      </div>

      {error && (
         <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
         </div>
      )}

      {/* FORM */}
      <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
         <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            
            {/* Section 1: Informasi Klien & Proyek */}
            <div className="p-6 sm:p-8 space-y-6">
               <h3 className="font-extrabold text-emerald-900 text-lg flex items-center gap-2">
                  <Boxes size={20} className="text-emerald-600" /> Informasi Dasar
               </h3>
               
               <div className="bg-white border border-emerald-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 mb-2">
                  <label className="flex-1 relative flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 cursor-pointer rounded-xl hover:border-emerald-500 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-100/50">
                     <input type="radio" name="design_flow" value="need_design" defaultChecked className="text-emerald-600 w-5 h-5" />
                     <div>
                        <span className="text-sm font-extrabold text-emerald-900 block mb-0.5">Butuh Desain Baru</span>
                        <span className="text-xs text-emerald-700/80 font-medium">Masuk antrean Tim Desain (Status: Briefing)</span>
                     </div>
                  </label>
                  <label className="flex-1 relative flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 cursor-pointer rounded-xl hover:border-emerald-500 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                     <input type="radio" name="design_flow" value="ready_print" className="text-emerald-600 w-5 h-5" />
                     <div>
                        <span className="text-sm font-extrabold text-gray-900 block mb-0.5">Desain Sudah Siap</span>
                        <span className="text-xs text-gray-500 font-medium">Langsung lempar ke Tim Produksi (Status: Produksi)</span>
                     </div>
                  </label>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-gray-700">Pilih Klien</label>
                        <CreateClientModal defaultRole="client" />
                     </div>
                     <select required name="client_id" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium outline-none transition-all">
                        <option value="">-- Pilih Klien / Customer --</option>
                        {clients.map(c => (
                           <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Judul Pesanan</label>
                     <input required type="text" name="title" placeholder="Misal: Cetak Spanduk Acara 17an" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Jenis Layanan / Barang</label>
                     <select required name="item_type" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium outline-none transition-all">
                        <option value="">-- Pilih Layanan / Barang --</option>
                        {services && services.length > 0 ? (
                           services.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                           ))
                        ) : (
                           <option value="Custom Layanan">Custom Layanan (Tambahkan di Pengaturan)</option>
                        )}
                     </select>
                  </div>
                  <CurrencyInput name="total_price" label="Nilai Pesanan (Rp)" />
               </div>
            </div>

            {/* Section 2: Spesifikasi Fisik */}
            <div className="p-6 sm:p-8 space-y-6 bg-emerald-50/20">
               <h3 className="font-extrabold text-emerald-900 text-lg flex items-center gap-2">
                  <Boxes size={20} className="text-emerald-600" /> Spesifikasi & Detail
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Kuantitas (Jumlah)</label>
                     <input required type="number" name="quantity" min={1} defaultValue={1} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold outline-none transition-all" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Tenggat Waktu (Deadline Produksi)</label>
                     <input required type="date" name="production_deadline" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-2">Catatan Bahan / Material</label>
                     <input type="text" name="material_notes" placeholder="Misal: Bahan Flexy 280gsm, Ring Mata Ayam 4 sudut..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-2">Alamat Pengiriman (Jika dikirim kurir)</label>
                     <textarea name="shipping_address" rows={2} placeholder="Masukkan alamat lengkap penerima untuk keperluan logistik nanti..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all"></textarea>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Catatan Ukuran</label>
                     <input type="text" name="size_notes" placeholder="Misal: 3x1 Meter" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2">Catatan Warna</label>
                     <input type="text" name="color_notes" placeholder="Misal: Dominan Merah Putih" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm outline-none transition-all" />
                  </div>
               </div>
            </div>

            {/* Section 3: Opsi Penagihan (Kasir) */}
            <div className="p-6 sm:p-8 space-y-6 bg-blue-50/30">
               <h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2">
                  <ReceiptText size={20} className="text-blue-600" /> Opsi Kasir & Penagihan
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="relative flex flex-col p-4 bg-white border border-gray-200 cursor-pointer rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                     <input type="radio" name="billing_type" value="none" defaultChecked className="absolute top-4 right-4 text-blue-600" />
                     <span className="text-sm font-extrabold text-gray-900 block mb-1">Bayar Nanti</span>
                     <span className="text-xs text-gray-500">Masukkan ke antrean produksi tanpa membuat tagihan sekarang.</span>
                  </label>
                  
                  <label className="relative flex flex-col p-4 bg-white border border-gray-200 cursor-pointer rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                     <input type="radio" name="billing_type" value="dp" className="absolute top-4 right-4 text-blue-600" />
                     <span className="text-sm font-extrabold text-gray-900 block mb-1">Tagih DP (50%)</span>
                     <span className="text-xs text-gray-500">Langsung buat tagihan Down Payment & bawa ke Kasir.</span>
                  </label>

                  <label className="relative flex flex-col p-4 bg-white border border-gray-200 cursor-pointer rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                     <input type="radio" name="billing_type" value="full" className="absolute top-4 right-4 text-blue-600" />
                     <span className="text-sm font-extrabold text-gray-900 block mb-1">Tagih Lunas (100%)</span>
                     <span className="text-xs text-gray-500">Buat tagihan pembayaran penuh & cetak nota.</span>
                  </label>
               </div>
            </div>

            {/* ACTION */}
            <div className="p-6 sm:p-8 bg-gray-50 flex items-center justify-end gap-4">
               <Link href="/dashboard/production" className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
                  Batal
               </Link>
               <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md">
                  <Save size={18} /> {isSubmitting ? 'Menyimpan...' : 'Simpan & Masukkan Antrean'}
               </button>
            </div>
         </form>
      </div>

    </div>
  )
}
