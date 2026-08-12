'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-[10px] hover:bg-[#1D4ED8] transition-all shadow-sm print:hidden"
    >
      <Printer size={16} /> Cetak / Download PDF
    </button>
  )
}
