'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  BadgeCheck,
  X,
  ShieldAlert,
  ShieldOff,
  Calendar,
  Briefcase,
  Layers,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  UserPlus,
  Users,
  Trash2,
  Eye,
} from 'lucide-react'
import { suspendAgency, updateLicenseExpiry, addAdminToAgency, impersonateAgency } from './actions'
import AgencyProjects from './AgencyProjects'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgencyService {
  id: string
  name: string
  organization_id: string
}

interface Agency {
  id: string
  name: string
  slug: string
  created_at: string
  is_active: boolean | null
  license_expires_at: string | null
  auto_suspend: boolean | null
  profiles: { email: string | undefined }
  projectCount: number
  services: AgencyService[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

function resolveStatus(agency: Agency): 'active' | 'suspended' | 'expired' {
  if (agency.is_active === false) return 'suspended'
  if (agency.auto_suspend && isExpired(agency.license_expires_at)) return 'expired'
  return 'active'
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'suspended' | 'expired' }) {
  if (status === 'active')
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <BadgeCheck size={13} /> ACTIVE
      </div>
    )
  if (status === 'expired')
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <Clock size={13} /> EXPIRED
      </div>
    )
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
      <ShieldOff size={13} /> SUSPENDED
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AgenciesList({ agencies }: { agencies: any[] }) {
  const router = useRouter()
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIGITAL' | 'PHYSICAL' | 'HYBRID'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  // Modal local state (mirrors DB values, editable before save)
  const [expiryDate, setExpiryDate] = useState('')
  const [autoSuspend, setAutoSuspend] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  // Add admin modal state
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [addAdminResult, setAddAdminResult] = useState<{ email: string; password: string; name: string } | null>(null)
  const [addAdminError, setAddAdminError] = useState<string | null>(null)

  const getAgencyCategory = (agency: any): 'DIGITAL' | 'PHYSICAL' | 'HYBRID' => {
    const isIndPhysical = agency.industry_type === 'PHYSICAL' || agency.industry_type === 'MANUFACTURING'
    const isPhys = agency.module_physical === true || isIndPhysical
    const isDig = agency.module_digital !== false && !isIndPhysical
    if (isDig && isPhys) return 'HYBRID'
    if (isPhys) return 'PHYSICAL'
    return 'DIGITAL'
  }

  const filteredAgencies = agencies.filter((agency) => {
    const cat = getAgencyCategory(agency)
    const matchesTab = activeTab === 'ALL' ? true : cat === activeTab
    const matchesSearch = 
      agency.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const openModal = (agency: any) => {
    setSelectedAgency(agency)
    setExpiryDate(
      agency.license_expires_at
        ? new Date(agency.license_expires_at).toISOString().split('T')[0]
        : ''
    )
    setAutoSuspend(agency.auto_suspend ?? false)
    setFeedbackMsg(null)
  }

  const closeModal = () => {
    setSelectedAgency(null)
    setFeedbackMsg(null)
    setShowAddAdmin(false)
    setNewAdminEmail('')
    setNewAdminName('')
    setAddAdminResult(null)
    setAddAdminError(null)
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSuspendToggle = () => {
    if (!selectedAgency) return
    const isSuspended = selectedAgency.is_active === false
    const action = isSuspended ? 'aktifkan kembali' : 'suspend'

    if (!confirm(`Yakin ingin ${action} agensi "${selectedAgency.name}" sekarang?`)) return

    startTransition(async () => {
      const res = await suspendAgency(selectedAgency.id, !isSuspended)
      if (res?.error) {
        setFeedbackMsg({ type: 'error', text: res.error })
      } else {
        setFeedbackMsg({
          type: 'success',
          text: isSuspended
            ? 'Agensi berhasil diaktifkan kembali.'
            : 'Agensi berhasil di-suspend. Akses login admin telah diblokir.',
        })
        setSelectedAgency((prev: any) =>
          prev ? { ...prev, is_active: isSuspended ? true : false } : null
        )
      }
    })
  }

  const handleAddAdmin = () => {
    if (!selectedAgency) return
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      setAddAdminError('Email dan nama wajib diisi.')
      return
    }

    setAddAdminError(null)
    setAddAdminResult(null)

    startTransition(async () => {
      const res = await addAdminToAgency(selectedAgency.id, newAdminEmail.trim(), newAdminName.trim())
      if (res?.error) {
        setAddAdminError(res.error)
      } else if ('password' in res && res.success) {
        setAddAdminResult({
          email:    res.email as string,
          password: res.password as string,
          name:     res.adminName as string,
        })
        setNewAdminEmail('')
        setNewAdminName('')
      }
    })
  }

  const handleSaveLicense = () => {
    if (!selectedAgency) return

    startTransition(async () => {
      const res = await updateLicenseExpiry(
        selectedAgency.id,
        expiryDate || null,
        autoSuspend,
      )
      if (res?.error) {
        setFeedbackMsg({ type: 'error', text: res.error })
      } else if ('autoSuspended' in res && res.autoSuspended) {
        setFeedbackMsg({
          type: 'warning',
          text: 'Lisensi disimpan. Tanggal sudah terlewat — agensi otomatis di-suspend sekarang.',
        })
        setSelectedAgency((prev: any) => prev ? { ...prev, is_active: false } : null)
      } else {
        setFeedbackMsg({ type: 'success', text: 'Pengaturan lisensi berhasil disimpan.' })
        setSelectedAgency((prev: any) =>
          prev
            ? { ...prev, license_expires_at: expiryDate || null, auto_suspend: autoSuspend }
            : null
        )
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-black/5 overflow-hidden">
      
      {/* ── Table Header & Category Tabs ─────────────────────────────────── */}
      <div className="p-6 border-b border-black/5 bg-[#F8F9FA]/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
            <Users className="text-[#2563EB]" size={20} />
            Daftar Tenant Agensi ({agencies.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola izin lisensi, masa aktif, dan status operasional masing-masing agensi.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center p-1 bg-white border border-black/10 rounded-[14px] shadow-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === 'ALL' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua ({agencies.length})
          </button>
          <button
            onClick={() => setActiveTab('DIGITAL')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === 'DIGITAL' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌐 Digital
          </button>
          <button
            onClick={() => setActiveTab('PHYSICAL')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === 'PHYSICAL' ? 'bg-orange-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Fisik
          </button>
          <button
            onClick={() => setActiveTab('HYBRID')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === 'HYBRID' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Hybrid
          </button>
        </div>
      </div>

      {/* ── Agencies Table ─────────────────────────────────────────────────── */}
      <div className="p-2 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/40">
              <th className="py-3.5 px-4 rounded-tl-[12px]">Nama Agensi & Tipe</th>
              <th className="py-3.5 px-4">Email Owner & Kontak</th>
              <th className="py-3.5 px-4">Pengguna & Proyek</th>
              <th className="py-3.5 px-4">Volume Bisnis</th>
              <th className="py-3.5 px-4">Status Lisensi</th>
              <th className="py-3.5 px-4 text-right rounded-tr-[12px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredAgencies.map((agency) => {
              const status = resolveStatus(agency)
              const cat = getAgencyCategory(agency)

              return (
                <tr key={agency.id} className="hover:bg-[#F8F9FA] transition-colors">
                  {/* AGENSI & TIPE */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm uppercase shadow-xs shrink-0 text-white ${
                        cat === 'HYBRID' ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600' :
                        cat === 'PHYSICAL' ? 'bg-gradient-to-tr from-orange-500 to-amber-500' :
                        'bg-gradient-to-tr from-blue-600 to-cyan-500'
                      }`}>
                        {agency.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-[#111827] text-sm">{agency.name}</p>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            cat === 'HYBRID' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            cat === 'PHYSICAL' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {cat}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] font-mono mt-0.5">/{agency.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* OWNER EMAIL */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                      <Mail size={13} className="text-[#9CA3AF] shrink-0" />
                      {agency.profiles?.email || '—'}
                    </div>
                    {agency.hasSheets && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        📊 Google Sheets Aktif
                      </span>
                    )}
                  </td>

                  {/* PENGGUNA & PROYEK */}
                  <td className="py-4 px-4 align-middle">
                    <div className="text-xs font-bold text-gray-900">
                      👥 {agency.staffCount || 0} Staf &bull; 👤 {agency.clientCount || 0} Klien
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                      📁 {agency.projectCount || 0} Proyek Terdata
                    </div>
                  </td>

                  {/* TOTAL REVENUE */}
                  <td className="py-4 px-4 align-middle">
                    <div className="text-xs font-extrabold text-emerald-600">
                      Rp {Number(agency.totalRevenue || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Target: Rp {Number(agency.monthly_sales_target || 0).toLocaleString('id-ID')}
                    </div>
                  </td>

                  {/* STATUS LISENSI */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge status={status} />
                      {agency.license_expires_at && (
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Calendar size={10} /> s/d {new Date(agency.license_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* AKSI */}
                  <td className="py-4 px-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setImpersonatingId(agency.id)
                          startTransition(async () => {
                            await impersonateAgency(agency.id)
                            router.push('/dashboard')
                          })
                        }}
                        disabled={impersonatingId === agency.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-2 rounded-[10px] transition-all shadow-xs"
                        title="Login sebagai tenant ini"
                      >
                        {impersonatingId === agency.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Eye size={12} />}
                        Masuk Dasbor
                      </button>
                      <button
                        onClick={() => openModal(agency)}
                        className="text-xs font-extrabold text-[#111827] bg-white border border-black/10 hover:bg-[#111827] hover:text-white px-4 py-2 rounded-[10px] transition-all shadow-xs"
                      >
                        Kelola Lisensi
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredAgencies.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center text-[#4B5563] text-sm">
                  Tidak ada tenant agensi yang cocok dengan filter tab ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Kelola Agensi ─────────────────────────────────────────────── */}
      {selectedAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-black/5 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex justify-between items-center bg-[#F8F9FA]/60 shrink-0">
              <h2 className="font-extrabold text-lg text-[#111827] font-['Plus_Jakarta_Sans']">
                Kelola Tenant
              </h2>
              <button
                onClick={closeModal}
                className="text-[#9CA3AF] hover:text-rose-500 transition-colors p-1.5 hover:bg-rose-50 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-5 overflow-y-auto">

              {/* Feedback Banner */}
              {feedbackMsg && (
                <div
                  className={`flex items-start gap-2.5 p-3.5 rounded-[12px] border text-xs font-semibold ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : feedbackMsg.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}
                >
                  {feedbackMsg.type === 'success' && <CheckCircle2 size={15} className="shrink-0 mt-0.5" />}
                  {feedbackMsg.type === 'warning' && <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                  {feedbackMsg.type === 'error' && <XCircle size={15} className="shrink-0 mt-0.5" />}
                  {feedbackMsg.text}
                </div>
              )}

              {/* Agency Identity Card */}
              <div className="flex items-center gap-4 bg-[#EFF6FF] border border-blue-100 p-4 rounded-[14px]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2563EB] to-cyan-400 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm shrink-0">
                  {selectedAgency.name.substring(0, 1)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#111827] text-base leading-tight truncate">
                    {selectedAgency.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-[#4B5563] mt-0.5">
                    <Mail size={13} className="text-[#9CA3AF] shrink-0" />
                    <span className="truncate">{selectedAgency.profiles?.email || '—'}</span>
                  </div>
                </div>
              </div>



              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Registration Date */}
                <div className="bg-[#F8F9FA] border border-black/5 rounded-[12px] p-3 text-center">
                  <Calendar size={16} className="text-[#9CA3AF] mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-0.5">
                    Tgl Daftar
                  </p>
                  <p className="text-xs font-bold text-[#111827]">
                    {formatDate(selectedAgency.created_at)}
                  </p>
                </div>

                {/* Project Count */}
                <div className="bg-[#F8F9FA] border border-black/5 rounded-[12px] p-3 text-center">
                  <Briefcase size={16} className="text-[#2563EB] mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-0.5">
                    Total Proyek
                  </p>
                  <p className="text-2xl font-extrabold text-[#2563EB]">
                    {selectedAgency.projectCount}
                  </p>
                </div>

                {/* Status */}
                <div className="bg-[#F8F9FA] border border-black/5 rounded-[12px] p-3 text-center flex flex-col items-center justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">
                    Status
                  </p>
                  <StatusBadge status={resolveStatus(selectedAgency)} />
                </div>
              </div>

              {/* Active Services */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2 flex items-center gap-1.5">
                  <Layers size={12} /> Jasa Aktif
                </p>
                {selectedAgency.services?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAgency.services.map((svc: any) => (
                      <span
                        key={svc.id}
                        className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold rounded-full border border-blue-100"
                      >
                        {svc.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF] italic">Belum ada layanan terdaftar.</p>
                )}
              </div>

              {/* License / Expiry */}
              <div className="border border-black/8 rounded-[14px] p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4B5563] flex items-center gap-1.5">
                  <Clock size={12} /> Manajemen Lisensi
                </p>

                {/* Expiry Date Input */}
                <div>
                  <label htmlFor="modal-expiry" className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                    Tanggal Masa Berlaku (Expired Date)
                  </label>
                  <input
                    id="modal-expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    disabled={isPending}
                  />
                  {expiryDate && isExpired(expiryDate) && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={11} /> Tanggal ini sudah terlewat.
                    </p>
                  )}
                </div>

                {/* Auto-Suspend Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Mode Auto-Suspend</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Jika ON, agensi otomatis ter-suspend saat tanggal expired terlewati.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSuspend((v) => !v)}
                    disabled={isPending}
                    className="text-[#2563EB] disabled:opacity-50 transition-colors"
                    aria-label="Toggle auto-suspend"
                  >
                    {autoSuspend ? (
                      <ToggleRight size={36} className="text-[#2563EB]" />
                    ) : (
                      <ToggleLeft size={36} className="text-[#9CA3AF]" />
                    )}
                  </button>
                </div>

                {/* Save License Button */}
                <button
                  onClick={handleSaveLicense}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 px-4 py-3 rounded-[10px] transition-colors"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                  Simpan Pengaturan Lisensi
                </button>
              </div>

              {/* ── Multi-Admin Section ─────────────────────────────────── */}
              <div className="border border-black/8 rounded-[14px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4B5563] flex items-center gap-1.5">
                    <Users size={12} /> Admin Agensi
                  </p>
                  <button
                    onClick={() => { setShowAddAdmin((v) => !v); setAddAdminResult(null); setAddAdminError(null) }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                  >
                    <UserPlus size={13} /> Tambah Admin
                  </button>
                </div>

                {/* Current primary admin email */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FA] rounded-[10px] border border-black/5">
                  <Mail size={13} className="text-[#9CA3AF] shrink-0" />
                  <span className="text-xs font-medium text-[#4B5563] truncate">
                    {selectedAgency.profiles?.email ?? '—'}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                    Owner
                  </span>
                </div>

                {/* Add admin form */}
                {showAddAdmin && (
                  <div className="border border-[#2563EB]/20 bg-[#EFF6FF]/30 rounded-[12px] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#4B5563]">
                      Admin baru akan mendapat akses penuh ke semua fitur agensi.
                    </p>
                    <input
                      type="text"
                      placeholder="Nama lengkap admin baru"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                    <input
                      type="email"
                      placeholder="email@adminbaru.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />

                    {addAdminError && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                        <XCircle size={13} /> {addAdminError}
                      </p>
                    )}

                    {addAdminResult && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-[10px] p-3 space-y-2">
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> Admin berhasil ditambahkan!
                        </p>
                        <div className="space-y-1">
                          <p className="text-[11px] text-emerald-700">
                            <span className="font-bold">Nama:</span> {addAdminResult.name}
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            <span className="font-bold">Email:</span> {addAdminResult.email}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-mono bg-white/70 px-2 py-1 rounded">
                            <span className="font-sans font-bold">Password:</span> {addAdminResult.password}
                          </p>
                        </div>
                        <p className="text-[10px] text-amber-600 font-semibold">
                          ⚠ Catat password ini sekarang — tidak bisa dilihat lagi.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleAddAdmin}
                      disabled={isPending || !newAdminEmail.trim() || !newAdminName.trim()}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 px-4 py-2.5 rounded-[10px] transition-colors"
                    >
                      {isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                      Buat Akun Admin
                    </button>
                  </div>
                )}
              </div>

              {/* ── Agency Projects & Asset Retention ───────────────────── */}
              <AgencyProjects organizationId={selectedAgency.id} />

              {/* Danger Zone */}
              <div className="border border-rose-100 bg-rose-50/40 rounded-[14px] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-1.5">
                  <ShieldAlert size={13} /> Danger Zone
                </p>

                {selectedAgency.is_active === false ? (
                  /* Unsuspend */
                  <button
                    onClick={handleSuspendToggle}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60 px-4 py-3.5 rounded-[10px] transition-colors"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                    Aktifkan Kembali Tenant Ini
                  </button>
                ) : (
                  /* Suspend */
                  <button
                    onClick={handleSuspendToggle}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 px-4 py-3.5 rounded-[10px] transition-colors"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
                    Suspend Tenant Sekarang (Manual)
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F8F9FA]/60 border-t border-black/5 shrink-0">
              <button
                onClick={closeModal}
                className="w-full py-2.5 bg-white border border-black/10 text-[#4B5563] font-bold rounded-[10px] hover:bg-[#F8F9FA] transition-colors text-sm"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
