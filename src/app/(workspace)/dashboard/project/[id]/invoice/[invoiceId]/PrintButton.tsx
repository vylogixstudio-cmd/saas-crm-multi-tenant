'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-[10px] text-xs font-bold transition-all shadow-sm"
    >
      <Printer size={16} /> Cetak Invoice PDF
    </button>
  )
}
