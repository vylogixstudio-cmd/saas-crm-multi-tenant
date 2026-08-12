'use client'

import { useMemo } from 'react'
import { Package, Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
  project_physical_details: any
}

export default function PerformanceClient({ projects }: { projects: Project[] }) {
  const stats = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    
    let producedQty = 0
    let shippedQty = 0
    const overdue: Project[] = []
    
    projects.forEach(p => {
      const updatedDate = new Date(p.updated_at)
      const isThisWeek = updatedDate >= startOfWeek
      
      const physicalDetails = Array.isArray(p.project_physical_details) 
        ? p.project_physical_details[0] 
        : p.project_physical_details
        
      const qty = physicalDetails?.quantity || 1

      // Produksi lolos QC (ready_to_ship, shipping, completed) minggu ini
      if (['ready_to_ship', 'shipping', 'completed'].includes(p.status) && isThisWeek) {
        producedQty += qty
      }
      
      // Dikirim / Selesai minggu ini
      if ((['SHIPPED', 'DELIVERED'].includes(physicalDetails?.shipping_status) || ['shipping', 'completed'].includes(p.status)) && isThisWeek) {
        shippedQty += qty
      }
      
      // Overdue
      if (p.deadline) {
        const deadlineDate = new Date(p.deadline)
        if (deadlineDate < now && !['completed', 'cancelled'].includes(p.status)) {
          overdue.push(p)
        }
      }
    })
    
    return {
      producedQty,
      shippedQty,
      overdue: overdue.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    }
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Berhasil Diproduksi (Minggu Ini)</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.producedQty} <span className="text-sm font-normal text-gray-500">Item</span></h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-4 bg-blue-50 w-fit px-2 py-1 rounded-md">Lolos QC & Siap Kirim</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Berhasil Dikirim (Minggu Ini)</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.shippedQty} <span className="text-sm font-normal text-gray-500">Paket</span></h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Truck className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-green-600 font-medium mt-4 bg-green-50 w-fit px-2 py-1 rounded-md">Dalam Pengiriman / Selesai</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Proyek Terlambat (Overdue)</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-2">{stats.overdue.length} <span className="text-sm font-normal text-red-400">Proyek</span></h3>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-red-600 font-medium mt-4 bg-red-50 w-fit px-2 py-1 rounded-md">Membutuhkan Perhatian Segera</p>
        </div>
      </div>

      {/* Overdue Projects List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Clock size={20} className="text-gray-500" />
            Daftar Proyek Overdue
          </h2>
        </div>
        
        {stats.overdue.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle size={48} className="text-green-400 mb-4" />
            <p className="font-medium text-gray-900">Tidak ada proyek yang terlambat!</p>
            <p className="text-sm">Semua jadwal produksi berjalan dengan baik.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.overdue.map(project => (
              <div key={project.id} className="p-4 px-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{project.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1 text-red-600">
                      <Clock size={14} /> 
                      Deadline: {new Date(project.deadline!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-medium uppercase">
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/dashboard/project/${project.id}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Detail
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
