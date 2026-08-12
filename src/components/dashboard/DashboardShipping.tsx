import React from 'react'
import { Box, Printer, Truck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface DashboardShippingProps {
  userRole: string
  orgName: string
  projects: any[]
}

export default function DashboardShipping({ orgName, projects, userRole }: DashboardShippingProps) {
  
  // Hitung metrik berdasarkan projects yang masuk
  // Antrean Packing = ready_to_ship
  const packingQueue = projects.filter(p => p.status === 'ready_to_ship').length
  
  // Siap Kirim = packing_completed
  const readyToShip = projects.filter(p => p.status === 'packing_completed').length

  // Dalam Pengiriman = SHIPPED
  const shipped = projects.filter(p => p.project_physical_details?.[0]?.shipping_status === 'SHIPPED').length

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard Packing & Shipping</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Halo Staf Ekspedisi! Berikut ringkasan antrean logistik {orgName} hari ini.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Antrean Packing */}
        <div className="bg-indigo-600 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Box size={24} className="text-white" />
            </div>
            <span className="text-[10px] font-bold text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Prioritas</span>
          </div>
          <div className="mt-8 relative z-10">
            <p className="text-indigo-100 text-sm font-medium">Antrean Packing</p>
            <h3 className="text-4xl font-extrabold text-white mt-1">{packingQueue} <span className="text-lg font-medium opacity-80">Paket</span></h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 transform translate-x-4 translate-y-4">
             <Box size={120} />
          </div>
        </div>

        {/* Siap Kirim */}
        <div className="bg-sky-500 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Printer size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <p className="text-sky-100 text-sm font-medium">Siap Cetak Label</p>
            <h3 className="text-4xl font-extrabold text-white mt-1">{readyToShip} <span className="text-lg font-medium opacity-80">Paket</span></h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 transform translate-x-4 translate-y-4">
             <Printer size={120} />
          </div>
        </div>

        {/* Dalam Pengiriman */}
        <div className="bg-orange-500 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Truck size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <p className="text-orange-100 text-sm font-medium">Sedang Dikirim</p>
            <h3 className="text-4xl font-extrabold text-white mt-1">{shipped} <span className="text-lg font-medium opacity-80">Paket</span></h3>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 transform translate-x-4 translate-y-4">
             <Truck size={120} />
          </div>
        </div>

      </div>

      {/* Quick Links Menu */}
      <div>
        <h3 className="font-extrabold text-gray-900 mb-4 text-lg">Menu Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/packing" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Box size={20} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Bungkus Barang</h4>
            <p className="text-xs text-gray-500 mt-1">Mulai packing paket dari daftar antrean QC.</p>
          </Link>

          <Link href="/dashboard/shipping/labels" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-sky-400 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Printer size={20} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Cetak Resi</h4>
            <p className="text-xs text-gray-500 mt-1">Cetak label pengiriman massal atau spesifik.</p>
          </Link>

          <Link href="/dashboard/shipping" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Truck size={20} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Input Kurir</h4>
            <p className="text-xs text-gray-500 mt-1">Input data nomor pelacakan dari ekspedisi.</p>
          </Link>

          <Link href="/dashboard/shipping/confirmation" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Konfirmasi Tiba</h4>
            <p className="text-xs text-gray-500 mt-1">Selesaikan proyek untuk paket yang sudah diterima.</p>
          </Link>
        </div>
      </div>

    </div>
  )
}
