'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] px-4 py-2 bg-white border border-black/10 rounded-[10px] shadow-sm transition-all"
    >
      <ArrowLeft size={16} /> Kembali
    </button>
  )
}
