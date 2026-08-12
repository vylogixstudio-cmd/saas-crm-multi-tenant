'use client'

import { useState } from 'react'
import { SystemBroadcast } from '@/lib/superAdminStore'
import { Megaphone, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function GlobalBroadcastBanner({ broadcast }: { broadcast: SystemBroadcast | null }) {
  const [dismissed, setDismissed] = useState(false)

  if (!broadcast || !broadcast.is_active || dismissed) return null

  const getStyle = () => {
    switch (broadcast.type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-500 text-amber-950',
          icon: <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        }
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        }
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          badge: 'bg-blue-600 text-white',
          icon: <Megaphone size={16} className="text-blue-600 shrink-0 mt-0.5" />
        }
    }
  }

  const style = getStyle()

  return (
    <div className={`p-4 rounded-[16px] border ${style.bg} shadow-xs mb-6 flex items-start justify-between gap-3 transition-all`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${style.badge}`}>
              Pengumuman Sistem
            </span>
            <h4 className="font-extrabold text-sm">{broadcast.title}</h4>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">{broadcast.message}</p>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-black/5 rounded-full text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        title="Tutup Pengumuman"
      >
        <X size={15} />
      </button>
    </div>
  )
}
