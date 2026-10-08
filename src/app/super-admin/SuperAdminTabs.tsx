'use client'

import { useState } from 'react'
import { Building2, Megaphone, Activity, Settings } from 'lucide-react'
import AgenciesList from './AgenciesList'
import BroadcastPanel from './BroadcastPanel'
import HealthPanel from './HealthPanel'
import PlatformSettingsPanel from './PlatformSettingsPanel'
import SuperAdminForm from './SuperAdminForm'
import { SystemBroadcast, SystemSettings } from '@/lib/superAdminStore'
import { EnrichedAgency } from './page'

// ── Props ─────────────────────────────────────────────────────────────────────
interface SuperAdminTabsProps {
  agencies: EnrichedAgency[]
  broadcasts: SystemBroadcast[]
  settings: SystemSettings
  globalStats: {
    totalProjects: number
    totalOrgs: number
    totalProfiles: number
    totalTransactions: number
    totalServices: number
  }
}

const TABS = [
  { id: 'tenants',    label: '🏢 Tenant',      icon: <Building2 size={15} /> },
  { id: 'broadcast',  label: '📢 Broadcast',    icon: <Megaphone size={15} /> },
  { id: 'health',     label: '📊 System Health', icon: <Activity size={15} /> },
  { id: 'settings',   label: '⚙️ Pengaturan',   icon: <Settings size={15} /> },
] as const

type TabId = typeof TABS[number]['id']

export default function SuperAdminTabs({ agencies, broadcasts, settings, globalStats }: SuperAdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('tenants')

  return (
    <div className="space-y-0">
      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white border border-black/5 rounded-[20px] p-1.5 shadow-sm overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.id === 'tenants' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {agencies.length}
              </span>
            )}
            {tab.id === 'broadcast' && broadcasts.filter(b => b.is_active).length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {broadcasts.filter(b => b.is_active).length}
              </span>
            )}
            {tab.id === 'settings' && settings.maintenance_mode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-rose-100 text-rose-600 animate-pulse">⚠️</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div className="pt-4">
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <SuperAdminForm />
            <AgenciesList agencies={agencies} />
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-[24px] border border-black/5 shadow-sm p-6">
            <BroadcastPanel
              initialBroadcasts={broadcasts}
              agencies={agencies.map(a => ({ id: a.id, name: a.name }))}
            />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="bg-white rounded-[24px] border border-black/5 shadow-sm p-6">
            <HealthPanel
              agencies={agencies.map(a => ({
                id: a.id,
                name: a.name,
                type: a.industry_type || 'DIGITAL',
                projectCount: a.projectCount,
                staffCount: a.staffCount,
                clientCount: a.clientCount,
                hasSheets: a.hasSheets,
                totalRevenue: a.totalRevenue,
                is_active: a.is_active,
              }))}
              stats={globalStats}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-[24px] border border-black/5 shadow-sm p-6">
            <PlatformSettingsPanel initialSettings={settings} />
          </div>
        )}
      </div>
    </div>
  )
}
