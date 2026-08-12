'use client'

import { useState, useTransition } from 'react'
import { FileText, X, Send } from 'lucide-react'
import { replyToRevision } from '@/app/(workspace)/dashboard/actions'

interface RevisionInfo {
  id: string
  title: string
  description: string
  status: string
  project_title: string
  client_name: string
  admin_reply: string | null
}

interface Props {
  revision: RevisionInfo
  isOpen: boolean
  onClose: () => void
}

export default function ReplyRevisionModal({ revision, isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-[#111827] text-white p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <FileText size={100} />
          </div>
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
            <X size={20} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={20} className="text-rose-400" />
              <h3 className="font-extrabold text-lg">Kelola Tiket Revisi</h3>
            </div>
            <p className="text-sm text-white/70">Proyek: <span className="font-bold text-white">{revision.project_title}</span></p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#111827] mb-1">{revision.title}</h4>
            <p className="text-xs text-[#4B5563] whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-black/5">{revision.description}</p>
          </div>

          <form action={(formData) => {
            startTransition(() => {
              replyToRevision(formData).then(() => onClose())
            })
          }}>
            <input type="hidden" name="revisionId" value={revision.id} />
            <input type="hidden" name="status" value="Proses" /> {/* Auto move to proses */}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Balasan / Catatan Admin</label>
                <textarea
                  name="adminReply"
                  defaultValue={revision.admin_reply ?? ''}
                  rows={4}
                  placeholder="Ketik balasan untuk klien..."
                  className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] transition-all resize-none"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-2.5 text-sm font-bold text-[#4B5563] hover:bg-black/5 rounded-[12px] transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-[12px] transition-all shadow-sm disabled:opacity-50"
              >
                <Send size={16} />
                {isPending ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
