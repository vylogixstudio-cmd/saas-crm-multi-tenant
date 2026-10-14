'use client'

import { useTransition } from 'react'
import { stopImpersonation } from '@/app/super-admin/actions'
import { Crown, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'

export default function ImpersonationBanner({ orgName }: { orgName: string }) {
  const [isPending, startTransition] = useTransition()

  const handleExit = () => {
    startTransition(async () => {
      await stopImpersonation()
      window.location.href = '/super-admin'
    })
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 bg-black/20 rounded-lg text-amber-200 shrink-0">
          <Crown size={16} />
        </div>
        <div className="text-xs truncate flex items-center gap-2">
          <span className="font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded text-[10px] shrink-0">
            Mode Impersonasi
          </span>
          <span className="font-medium text-white/90 truncate">
            Inspeksi dasbor agensi: <strong className="text-white font-extrabold">{orgName}</strong>
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 bg-black/30 text-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-300/30 shrink-0">
            <ShieldCheck size={12} className="text-emerald-300" /> Read-Only Guard Aktif
          </span>
        </div>
      </div>

      <button
        onClick={handleExit}
        disabled={isPending}
        className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold bg-black/40 hover:bg-black/60 text-white px-3.5 py-1.5 rounded-full transition-all border border-white/20 shadow-xs"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeft size={13} />}
        Kembali ke Super Admin Console
      </button>
    </div>
  )
}
