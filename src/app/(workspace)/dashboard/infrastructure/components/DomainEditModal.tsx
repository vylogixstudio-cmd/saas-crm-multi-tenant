'use client'

import { useState, useTransition } from 'react'
import { Server, X, Globe, Save } from 'lucide-react'
import { updateDomainInfo } from '@/app/(workspace)/dashboard/actions'

interface DomainInfo {
  id: string
  title: string
  domain_name: string | null
  domain_expiry_date: string | null
  hosting_info: string | null
  project_digital_details?: any
}

interface Props {
  project: DomainInfo
  isOpen: boolean
  onClose: () => void
}

export default function DomainEditModal({ project, isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-[#111827] text-white p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Server size={100} />
          </div>
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={20} className="text-emerald-400" />
              <h3 className="font-extrabold text-lg">Kelola Domain & Server</h3>
            </div>
            <p className="text-sm text-white/70">Proyek: <span className="font-bold text-white">{project.title}</span></p>
          </div>
        </div>

        <form action={(formData) => {
          startTransition(() => {
            updateDomainInfo(project.id, formData).then(() => onClose())
          })
        }}>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Nama Domain</label>
              <input
                type="text"
                name="domainName"
                defaultValue={project.domain_name ?? ''}
                placeholder="contoh.com"
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Tanggal Expired Domain</label>
              <input
                type="date"
                name="domainExpiryDate"
                defaultValue={project.domain_expiry_date ? new Date(project.domain_expiry_date).toISOString().split('T')[0] : ''}
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Durasi Garansi</label>
                <select
                  name="warrantyMonths"
                  defaultValue={
                    Array.isArray(project.project_digital_details)
                      ? project.project_digital_details[0]?.warranty_months ?? 0
                      : project.project_digital_details?.warranty_months ?? 0
                  }
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] transition-all cursor-pointer"
                >
                  <option value="0">Tidak Ada Garansi</option>
                  <option value="1">1 Bulan</option>
                  <option value="3">3 Bulan</option>
                  <option value="6">6 Bulan</option>
                  <option value="12">1 Tahun</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Tgl Habis Garansi</label>
                <input
                  type="date"
                  name="warrantyExpiredAt"
                  defaultValue={(() => {
                    const dt = Array.isArray(project.project_digital_details)
                      ? project.project_digital_details[0]?.warranty_expired_at
                      : project.project_digital_details?.warranty_expired_at
                    return dt ? new Date(dt).toISOString().split('T')[0] : ''
                  })()}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] transition-all cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Informasi Hosting/Server</label>
              <textarea
                name="hostingInfo"
                defaultValue={project.hosting_info ?? ''}
                rows={3}
                placeholder="Detail login panel / URL hosting..."
                className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium font-mono focus:border-[#2563EB] outline-none text-[#2563EB] transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-black/5 bg-[#F8F9FA]/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-[#4B5563] hover:bg-black/5 rounded-[12px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-[12px] transition-all shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
