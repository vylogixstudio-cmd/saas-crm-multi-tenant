'use client'

import { useState, useTransition } from 'react'
import { Database, HardDrive, Users, FolderOpen, FileText, Activity, RefreshCw, Loader2, BarChart3, TrendingUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AgencyHealthData {
  id: string
  name: string
  type: string
  projectCount: number
  staffCount: number
  clientCount: number
  hasSheets: boolean
  totalRevenue: number
  is_active: boolean | null
}

interface SystemHealthStats {
  totalProjects: number
  totalOrgs: number
  totalProfiles: number
  totalTransactions: number
  totalServices: number
}

interface HealthPanelProps {
  agencies: AgencyHealthData[]
  stats: SystemHealthStats
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HealthPanel({ agencies, stats }: HealthPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [refreshed, setRefreshed] = useState(false)

  function handleRefresh() {
    startTransition(() => {
      // Trigger a soft re-fetch by reloading (page is server-rendered)
      window.location.reload()
    })
    setRefreshed(true)
    setTimeout(() => setRefreshed(false), 3000)
  }

  const getTypeTag = (type: string) => {
    if (type === 'DIGITAL') return { label: '🌐 Digital', cls: 'bg-blue-100 text-blue-700' }
    if (type === 'PHYSICAL') return { label: '📦 Fisik', cls: 'bg-orange-100 text-orange-700' }
    return { label: '⚡ Hybrid', cls: 'bg-purple-100 text-purple-700' }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-[14px]">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">System Health & Storage Monitor</h2>
            <p className="text-xs text-gray-500">Pantau kesehatan database, storage, dan sync Google Sheets</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-[12px] transition-all shadow-xs"
        >
          <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
          {refreshed ? 'Refreshed!' : 'Refresh Data'}
        </button>
      </div>

      {/* ── Global DB Stats Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Organisasi', value: stats.totalOrgs, icon: <Database size={16} />, color: 'blue' },
          { label: 'Total Proyek', value: stats.totalProjects, icon: <FolderOpen size={16} />, color: 'indigo' },
          { label: 'Total User', value: stats.totalProfiles, icon: <Users size={16} />, color: 'amber' },
          { label: 'Transaksi', value: stats.totalTransactions, icon: <TrendingUp size={16} />, color: 'emerald' },
          { label: 'Layanan', value: stats.totalServices, icon: <BarChart3 size={16} />, color: 'purple' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-[18px] border border-black/5 p-4 flex flex-col gap-2 shadow-xs">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center bg-${item.color}-50 text-${item.color}-600`}>
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
              <p className="text-xl font-extrabold text-[#111827]">{item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Per-Tenant Health Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <HardDrive size={16} className="text-gray-400" />
          <span className="text-sm font-extrabold text-[#111827]">Kesehatan Per Tenant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Agensi</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Tipe</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Proyek</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Tim</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Klien</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Sheets</th>
                <th className="py-3 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Volume (Rp)</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agencies.map((ag) => {
                const typeTag = getTypeTag(ag.type || 'DIGITAL')
                return (
                  <tr key={ag.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-[#111827] text-sm">{ag.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${typeTag.cls}`}>{typeTag.label}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-[#111827]">{ag.projectCount}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-[#111827]">{ag.staffCount}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-[#111827]">{ag.clientCount}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {ag.hasSheets
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">✅ Aktif</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">— Tidak</span>}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-[#111827]">
                      {ag.totalRevenue > 0 ? `${ag.totalRevenue.toLocaleString('id-ID')}` : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {ag.is_active !== false
                        ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">🟢 Aktif</span>
                        : <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-full">🔴 Suspended</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sheets Sync Health ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-black/5 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-gray-400" />
          <span className="text-sm font-extrabold text-[#111827]">Google Sheets Sync Status</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {agencies.map(ag => (
            <div key={ag.id} className={`rounded-[14px] px-4 py-3 border flex items-center justify-between gap-2 ${ag.hasSheets ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <span className="text-xs font-semibold text-[#111827] truncate">{ag.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ag.hasSheets ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 bg-gray-200'}`}>
                {ag.hasSheets ? '🔗 Connected' : 'Not Set'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
