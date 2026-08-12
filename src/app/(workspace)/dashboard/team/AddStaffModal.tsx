'use client'

import { useState, useTransition } from 'react'
import { addStaff } from './actions'
import { Plus, X, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddStaffModalProps {
  isPhysical?: boolean
  isHybrid?: boolean
}

export default function AddStaffModal({ isPhysical = false, isHybrid = false }: AddStaffModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await addStaff(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Staf berhasil ditambahkan!')
        setIsOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-[12px] shadow-sm transition-all"
      >
        <UserPlus size={16} /> Tambah Staf
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isPending && setIsOpen(false)}></div>
          
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 relative z-10 shadow-xl border border-black/5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-xl text-[#111827]">Tambah Staf Baru</h3>
                <p className="text-xs text-[#6B7280] mt-1">Undang anggota tim ke agensi Anda.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="p-2 text-[#9CA3AF] hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                <input 
                  type="text" 
                  name="fullName" 
                  required
                  placeholder="Misal: Budi Santoso"
                  className="w-full text-sm text-[#111827] bg-[#F8F9FA] border border-black/10 rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  required
                  placeholder="budi@agensi.com"
                  className="w-full text-sm text-[#111827] bg-[#F8F9FA] border border-black/10 rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Password Sementara *</label>
                <input 
                  type="password" 
                  name="password" 
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-sm text-[#111827] bg-[#F8F9FA] border border-black/10 rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
                <p className="text-[10px] text-[#6B7280] mt-1">Berikan password ini ke staf Anda agar mereka bisa login.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nomor WhatsApp (Opsional)</label>
                <input 
                  type="text" 
                  name="whatsappNumber" 
                  placeholder="08123456789"
                  className="w-full text-sm text-[#111827] bg-[#F8F9FA] border border-black/10 rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Role (Peran) *</label>
                <select 
                  name="role" 
                  required
                  defaultValue="staff_ops"
                  className="w-full text-sm font-semibold text-[#111827] bg-[#F8F9FA] border border-black/10 rounded-[12px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all cursor-pointer"
                >
                  {isHybrid ? (
                    <>
                      <option value="admin">Admin Agensi (Akses Penuh)</option>
                      <option value="staff_cs">CS / Keuangan Hybrid (CS + Finance)</option>
                      <option value="staff_ops">Supervisor Operasional Hybrid (Digital + Fisik)</option>
                      <option value="staff_executor">Eksekutor / Tim Digital</option>
                      <option value="staff_design">Desainer Fisik / Pre-Press</option>
                      <option value="staff_production">Operator Mesin / Produksi</option>
                      <option value="staff_warehouse">Admin Gudang / Inventory</option>
                      <option value="staff_shipping">Logistik & Packing</option>
                    </>
                  ) : isPhysical ? (
                    <>
                      <option value="admin">Admin Agensi (Akses Penuh)</option>
                      <option value="staff_digital">Staf Digital (Web, Desain Digital)</option>
                      <option value="staff_cs">Staf CS (Akses Klien & Proyek)</option>
                      <option value="staff_design">Staf Desainer Fisik (Cetak)</option>
                      <option value="staff_warehouse">Admin Gudang / Inventory</option>
                      <option value="staff_production">Operator Mesin / Produksi</option>
                      <option value="staff_shipping">Logistik & Packing</option>
                    </>
                  ) : (
                    <>
                      <option value="admin">Admin Agensi (Akses Penuh)</option>
                      <option value="staff_ops">Staf Operasional (Akses Proyek & Klien)</option>
                      <option value="staff_digital">Staf Digital (Hanya Akses Proyek)</option>
                      <option value="staff_finance">Staf Keuangan / Kasir (Akses Uang & Invoice)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-[#111827] text-white text-sm font-bold py-3.5 rounded-[12px] hover:bg-black transition-all shadow-sm disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {isPending ? 'Mendaftarkan...' : 'Daftarkan Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
