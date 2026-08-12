'use client'

import React, { useState } from 'react'
import { Printer, Search, MapPin, Phone, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

export default function LabelsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProjects.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProjects.map(p => p.id))
    }
  }

  const handlePrint = (projectId?: string) => {
    if (projectId) {
      // Single print: Set selected to ONLY this one, then print
      setSelectedIds([projectId])
      setTimeout(() => window.print(), 100)
    } else {
      // Bulk print
      if (selectedIds.length === 0) {
        toast.error('Silakan centang minimal 1 resi yang ingin dicetak.')
        return
      }
      window.print()
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0">
      
      {/* HEADER (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <Printer size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Cetak Label Pengiriman</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Pilih resi / label paket yang ingin dicetak.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari pesanan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
              />
           </div>
           
           <button 
             onClick={() => handlePrint()}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 transition-colors shadow-sm whitespace-nowrap"
           >
             <Printer size={16} /> Cetak {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Terpilih
           </button>
        </div>
      </div>

      {/* TOOLBAR SELEKSI (Hidden in Print) */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-sky-600 transition-colors">
            {selectedIds.length === filteredProjects.length ? (
              <><CheckSquare size={18} className="text-sky-600" /> Batal Pilih Semua</>
            ) : (
              <><Square size={18} className="text-gray-400" /> Pilih Semua ({filteredProjects.length})</>
            )}
          </button>
        </div>
      )}

      {/* LIST / GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-[24px] border border-gray-200 text-center flex flex-col items-center shadow-sm print:hidden">
             <Printer size={36} className="text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">Belum Ada Paket</h3>
             <p className="text-gray-500 text-xs mt-1">Selesaikan antrean packing terlebih dahulu.</p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const detail = Array.isArray(project.project_physical_details) ? project.project_physical_details[0] : project.project_physical_details
            const isSelected = selectedIds.includes(project.id)
            
            return (
            <div key={project.id} 
              className={`bg-white rounded-2xl shadow-sm flex flex-col transition-all cursor-pointer
                ${isSelected ? 'border-2 border-sky-500 ring-2 ring-sky-100 print:block' : 'border border-gray-200 hover:border-sky-300 print:hidden'}
                print:mb-8 print:break-inside-avoid print:border-black print:border-2 print:ring-0
              `}
              onClick={() => toggleSelect(project.id)}
            >
              
              {/* PRINTABLE LABEL AREA */}
              <div className="p-6 flex-1 flex flex-col print:p-8">
                 <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4 print:border-black">
                    <div>
                       <h2 className="text-xl font-extrabold text-gray-900 tracking-widest uppercase">VYLOGIX AGENCY</h2>
                       <p className="text-xs text-gray-500 mt-1">Pengirim</p>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                         #{project.id.split('-')[0].toUpperCase()}
                       </span>
                    </div>
                 </div>

                 <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Penerima:</p>
                    <p className="text-lg font-bold text-gray-900">{project.profiles?.full_name}</p>
                    
                    <div className="flex items-start gap-2 mt-3 text-sm text-gray-700">
                       <Phone size={16} className="mt-0.5 shrink-0 text-gray-400" />
                       <p>{project.profiles?.whatsapp_number || '-'}</p>
                    </div>

                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-700">
                       <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                       <p className="leading-relaxed">
                          {detail?.shipping_address || 'Alamat tidak diisi. (Mungkin diambil di tempat)'}
                       </p>
                    </div>
                 </div>

                 <div className="mt-6 pt-4 border-t border-gray-200 print:border-black">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Isi Paket:</p>
                    <p className="text-sm font-bold text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{detail?.item_type || 'Custom'} • {detail?.quantity || 1} Pcs</p>
                 </div>
              </div>

              {/* ACTION AREA (Hidden in Print) */}
              <div className="bg-gray-50 p-4 border-t border-gray-200 print:hidden flex items-center justify-between">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleSelect(project.id)} className="text-gray-500 hover:text-sky-600 transition-colors">
                    {isSelected ? <CheckSquare size={20} className="text-sky-600" /> : <Square size={20} />}
                  </button>
                  <span className="text-xs font-bold text-gray-600">Pilih Resi</span>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrint(project.id); }}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                >
                  <Printer size={14} /> Cetak Saja
                </button>
              </div>

            </div>
          )})
        )}
      </div>

    </div>
  )
}
