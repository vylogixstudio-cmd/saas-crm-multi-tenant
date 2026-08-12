'use client'

import { Palette, Clock, Cloud, Users, ArrowRight, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function DashboardDesign({ projects = [], clientsCount = 0, designAssetsCount = 0 }: any) {
  // Filter projects for Design Dashboard
  const antreanBaru = projects.filter((p: any) => p.status === 'briefing' || p.status === 'design');
  const menungguRevisi = projects.filter((p: any) => p.status === 'revision_pending' || p.status === 'revision');
  const prioritasAntrean = projects.filter((p: any) => ['briefing', 'design', 'revision_pending'].includes(p.status)).slice(0, 5);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Palette className="text-pink-600" size={32} />
            Dashboard Desain
          </h1>
          <p className="text-gray-500 font-medium mt-2">Kelola antrean desain, revisi, dan aset kreatif agensi.</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/design" className="block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-pink-200 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center">
              <Palette size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Antrean Baru</p>
              <h3 className="text-3xl font-black text-gray-900">{antreanBaru.length}</h3>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/design" className="block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-rose-200 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Menunggu Revisi</p>
              <h3 className="text-3xl font-black text-gray-900">{menungguRevisi.length}</h3>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/design/assets" className="block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-purple-200 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <Cloud size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Aset File (Cloud)</p>
              <h3 className="text-3xl font-black text-gray-900">{designAssetsCount}</h3>
            </div>
          </div>
        </Link>
        
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Klien Aktif</p>
              <h3 className="text-3xl font-black text-gray-900">{clientsCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="text-pink-600" size={20}/>
              Prioritas Antrean
            </h2>
            <Link href="/dashboard/design" className="text-sm font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {prioritasAntrean.length > 0 ? prioritasAntrean.map((p: any, index: number) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-pink-50/50 hover:border-pink-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-gray-400">
                    P{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{p.title}</h4>
                    <p className="text-xs font-medium text-gray-500 mt-1">Klien: {p.profiles?.full_name || '-'} • Deadline: {p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                  {p.status}
                </span>
              </div>
            )) : (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Tidak ada antrean desain saat ini.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Cloud size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                <Cloud size={24} />
              </div>
              <h2 className="text-2xl font-black mb-2">Aset Desain</h2>
              <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                Akses cepat ke database font, logo klien, template vektor, dan elemen grafis perusahaan.
              </p>
            </div>
            
            <Link 
              href="/dashboard/design/assets"
              className="bg-white text-gray-900 px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2 w-max"
            >
              Buka Aset Cloud <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
