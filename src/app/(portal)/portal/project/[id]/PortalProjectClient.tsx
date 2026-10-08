'use client'

import React, { useState, useTransition } from 'react'
import {
  CheckCircle2, AlertCircle, Clock, Package, CreditCard,
  Upload, FileText, ExternalLink, ChevronDown, Send, X, Loader2,
  Monitor, Server, ShieldCheck, Bug, Video, Image as ImageIcon,
  Truck, Hash, MapPin, Download, CheckCircle, RefreshCw, Layers,
  MessageSquare, MessageCircle, ArrowRight, Sparkles, UploadCloud,
  HelpCircle, AlertTriangle, Edit3, XCircle, Globe
} from 'lucide-react'
import {
  confirmPayment,
  requestInvoiceSplit,
  submitClientRevision,
  approveDesign,
  uploadClientAsset,
  createDigitalRevision,
  clientConfirmDelivery,
  clientReportDefect
} from '../../actions'

type Tab = 'overview' | 'tagihan' | 'teknis' | 'revisi' | 'aset' | 'desain_fisik'

export default function PortalProjectClient({
  project,
  invoices,
  notes = [],
  assets = [],
  revisions = [],
  org,
  digitalDetails,
  physicalDetails,
  currentUserId
}: {
  project: any
  invoices: any[]
  notes: any[]
  assets: any[]
  revisions?: any[]
  org: any
  digitalDetails: any
  physicalDetails: any
  currentUserId: string
}) {
  // Isolasi tegas: Agensi Fisik vs Agensi Digital
  const isPhysical = project.project_category === 'PHYSICAL' || org?.industry_type === 'PHYSICAL'
  const [activeTab, setActiveTab] = useState<Tab>(isPhysical ? 'desain_fisik' : 'overview')

  // Digital details fallback
  const dd = digitalDetails || {}
  const pd = physicalDetails || {}

  const previewUrl = dd.preview_url || project.preview_url
  const linkCloudinary = dd.link_cloudinary || project.link_cloudinary
  const linkYoutube = dd.link_youtube || project.link_youtube
  const domainName = dd.domain_name || project.domain_name
  const hostingInfo = dd.hosting_info || project.hosting_info
  const domainExpiryDate = dd.domain_expiry_date || project.domain_expiry_date
  const warrantyExpiredAt = dd.warranty_expired_at || project.warranty_expired_at
  const warrantyMonths = dd.warranty_months || project.warranty_months || 0

  // Form states for revisions & asset upload feedback
  const [isSubmittingRev, startRevTransition] = useTransition()
  const [revFeedback, setRevFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [isSubmittingAsset, startAssetTransition] = useTransition()
  const [assetFeedback, setAssetFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [isApprovingDesign, startApproveTransition] = useTransition()
  const [isSubmittingPhysicalRev, startPhysicalRevTransition] = useTransition()
  const [showPhysicalRevForm, setShowPhysicalRevForm] = useState(false)
  const [physicalRevFeedback, setPhysicalRevFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Delivery confirmation & Defect claim states
  const [isConfirmingDelivery, startConfirmDeliveryTransition] = useTransition()
  const [isSubmittingDefect, startDefectTransition] = useTransition()
  const [showDefectForm, setShowDefectForm] = useState(false)
  const [defectFeedback, setDefectFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      briefing: 'Briefing',
      design: 'Desain UI/UX',
      development: 'Development',
      revision: 'Sedang Direvisi',
      revision_pending: 'Menunggu Revisi',
      update_pengajuan: 'Pengajuan Update',
      maintenance: 'Maintenance',
      update_deploy: 'Deploy Server',
      production: 'Produksi',
      production_in_progress: 'Sedang Produksi',
      finishing: 'Finishing',
      qc_pending: 'Quality Control',
      packing_completed: 'Siap Kirim',
      ready_to_ship: 'Siap Kirim',
      shipped: 'Dalam Perjalanan',
      completed: 'Selesai',
      selesai: 'Selesai',
    }
    return map[status] || status
  }

  // Physical vs Digital Status Steps
  const statusSteps = isPhysical
    ? [
        { id: 'briefing', label: 'Brief / Data', desc: 'Pengumpulan Data' },
        { id: 'design', label: 'Desain Mockup', desc: 'Review Desain' },
        { id: 'production', label: 'Produksi', desc: 'Cetak & Sablon' },
        { id: 'packing_completed', label: 'Packing', desc: 'Quality Check' },
        { id: 'shipped', label: 'Pengiriman', desc: 'Dalam Perjalanan' },
        { id: 'completed', label: 'Selesai', desc: 'Pesanan Diterima' },
      ]
    : project.status?.startsWith('update_') || project.status === 'maintenance'
    ? [
        { id: 'update_pengajuan', label: 'Pengajuan', desc: 'Permintaan Masuk' },
        { id: 'maintenance', label: 'Maintenance', desc: 'Pengerjaan Tim' },
        { id: 'update_deploy', label: 'Deploy', desc: 'Tayang ke Server' },
        { id: 'completed', label: 'Selesai', desc: 'Bisa Dicek Klien' },
      ]
    : [
        { id: 'briefing', label: 'Briefing', desc: 'Analisis Kebutuhan' },
        { id: 'design', label: 'Desain UI/UX', desc: 'Mockup & Wireframe' },
        { id: 'development', label: 'Development', desc: 'Coding & Integrasi' },
        { id: 'completed', label: 'Selesai', desc: 'Serah Terima Proyek' },
      ]

  const getStepIndex = (status: string) => {
    if (isPhysical) {
      if (pd.shipping_status === 'DELIVERED' || status === 'completed' || status === 'selesai') return 5
      if (pd.shipping_status === 'SHIPPED' || status === 'shipped') return 4

      const physMap: Record<string, number> = {
        briefing: 0,
        design: 1, revision: 1, revision_pending: 1,
        production: 2, production_in_progress: 2, finishing: 2, qc_pending: 2,
        packing_completed: 3, ready_to_ship: 3,
        shipped: 4,
        completed: 5, selesai: 5,
      }
      return physMap[status] ?? 0
    }
    if (project.status?.startsWith('update_') || project.status === 'maintenance') {
      const map: Record<string, number> = { update_pengajuan: 0, maintenance: 1, update_deploy: 2, completed: 3 }
      return map[status] ?? 0
    }
    const digMap: Record<string, number> = {
      briefing: 0,
      design: 1, revision: 1, revision_pending: 1,
      development: 2,
      completed: 3, selesai: 3,
    }
    return digMap[status] ?? 0
  }

  const effectiveStatus = (isPhysical && pd.shipping_status === 'SHIPPED' && project.status !== 'completed') ? 'shipped' : project.status
  const currentStepIdx = getStepIndex(effectiveStatus)

  // Tab definitions based on Agency Category
  const tabs = isPhysical
    ? [
        { key: 'desain_fisik' as Tab, label: 'Review Mockup', icon: ImageIcon },
        { key: 'overview' as Tab, label: 'Alur Pesanan', icon: Package },
        { key: 'tagihan' as Tab, label: 'Tagihan & Invoice', icon: CreditCard },
        { key: 'aset' as Tab, label: 'Materi Cetak', icon: Upload },
      ]
    : [
        { key: 'overview' as Tab, label: 'Overview Proyek', icon: Monitor },
        { key: 'tagihan' as Tab, label: 'Tagihan & Invoice', icon: CreditCard },
        { key: 'teknis' as Tab, label: 'Domain & Server', icon: Server },
      ]

  // Default Categories based on Agency Type
  const defaultCategories = isPhysical
    ? [
        'Desain Siap Cetak (AI / PDF / CDR)',
        'File Logo / Sablon',
        'Data Ukuran & Pola',
        'Foto Sampel / Referensi Warna',
        'Dokumen / Nota Pembelian',
        'Lainnya',
      ]
    : [
        'Logo & Branding',
        'Font & Tipografi',
        'Desain Siap Cetak',
        'Dokumen & Copywriting',
        'Gambar Konten Web/App',
        'Database / File Teknis',
        'Lainnya',
      ]

  const activeCategories = (org?.custom_asset_categories && org.custom_asset_categories.length > 0)
    ? org.custom_asset_categories
    : defaultCategories

  // Physical revisions count from notes
  const physicalRevisionNotes = notes.filter((n: any) => n.is_client_message && n.content.includes('[REVISI DARI KLIEN]'))
  const physicalDesignerNotes = notes.filter((n: any) => n.visible_to_client && n.content.includes('[Catatan Desainer]'))
  const isAccApproved = notes.some((n: any) => n.content.includes('[ACC DARI KLIEN]')) || ['production', 'production_in_progress', 'finishing', 'qc_pending', 'packing_completed', 'ready_to_ship', 'shipped', 'completed', 'selesai'].includes(project.status)

  const revisionCount = isPhysical ? physicalRevisionNotes.length : revisions.length
  const MAX_FREE_REVISIONS = 3
  const isQuotaExceeded = revisionCount >= MAX_FREE_REVISIONS

  // Submit Digital Revision Handler
  const handleRevisionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startRevTransition(async () => {
      const res = await createDigitalRevision(project.id, fd)
      if (res?.error) {
        setRevFeedback({ type: 'error', msg: res.error })
      } else {
        setRevFeedback({ type: 'success', msg: 'Tiket revisi berhasil dikirim ke tim pengembang!' })
        form.reset()
        setTimeout(() => setRevFeedback(null), 5000)
      }
    })
  }

  // Submit Physical Revision Handler
  const handlePhysicalRevisionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startPhysicalRevTransition(async () => {
      const res = await submitClientRevision(project.id, fd)
      if (res?.error) {
        setPhysicalRevFeedback({ type: 'error', msg: res.error })
      } else {
        setPhysicalRevFeedback({ type: 'success', msg: 'Catatan revisi mockup berhasil dikirim ke tim desainer!' })
        form.reset()
        setShowPhysicalRevForm(false)
        setTimeout(() => setPhysicalRevFeedback(null), 6000)
      }
    })
  }

  // Submit Asset Handler
  const handleAssetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startAssetTransition(async () => {
      const res = await uploadClientAsset(project.id, fd)
      if (res?.error) {
        setAssetFeedback({ type: 'error', msg: res.error })
      } else {
        setAssetFeedback({ type: 'success', msg: 'Materi / aset berhasil disimpan ke cloud proyek!' })
        form.reset()
        setTimeout(() => setAssetFeedback(null), 5000)
      }
    })
  }

  // Submit Defect / Damaged Item Claim Handler
  const handleDefectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startDefectTransition(async () => {
      const res = await clientReportDefect(project.id, fd)
      if (res?.error) {
        setDefectFeedback({ type: 'error', msg: res.error })
      } else {
        setDefectFeedback({ type: 'success', msg: 'Laporan cacat/rusak berhasil dikirim! Tim agensi akan segera menghubungi Anda.' })
        form.reset()
        setShowDefectForm(false)
        setTimeout(() => setDefectFeedback(null), 8000)
      }
    })
  }

  // WhatsApp Link Helper
  const getWhatsAppLink = (customMsg?: string) => {
    if (!org?.whatsapp_number) return null
    const cleanNumber = org.whatsapp_number.replace(/\D/g, '')
    const formattedNumber = cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber
    const text = encodeURIComponent(customMsg || `Halo ${org.name || 'Tim Agensi'}, saya ingin konsultasi mengenai proyek "${project.title}".`)
    return `https://wa.me/${formattedNumber}?text=${text}`
  }

  const waLink = getWhatsAppLink()
  const waQuotaLink = getWhatsAppLink(`Halo ${org?.name || 'CS'}, kuota revisi standar untuk proyek "${project.title}" sudah 3x. Saya ingin konsultasi pengajuan revisi tambahan berbayar.`)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* PROJECT HEADER BANNER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-black/5 p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                isPhysical ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {isPhysical ? '📦 Agensi Fisik & Cetak' : '🌐 Agensi Digital & Software'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                {project.service_type || 'Layanan Kustom'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                ['completed', 'selesai'].includes(effectiveStatus) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                effectiveStatus === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                effectiveStatus === 'revision_pending' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {getStatusLabel(effectiveStatus)}
              </span>
            </div>

            <h1 className="font-extrabold text-2xl md:text-3xl text-gray-900 font-['Plus_Jakarta_Sans']">{project.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
              {project.deadline && (
                <p className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Target Selesai: <span className="font-bold text-gray-700">{new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
              )}
              {warrantyExpiredAt && (
                <p className={`flex items-center gap-1.5 ${new Date() <= new Date(warrantyExpiredAt) ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                  <ShieldCheck size={14} />
                  {new Date() <= new Date(warrantyExpiredAt)
                    ? `Garansi Aktif s/d ${new Date(warrantyExpiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Masa Garansi Selesai'}
                </p>
              )}
            </div>
          </div>

          {/* Progress & Quick WhatsApp */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3">
            <div className="bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-gray-100 w-full sm:w-auto md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Progress Proyek</p>
              <p className={`text-3xl md:text-4xl font-extrabold ${isPhysical ? 'text-orange-500' : 'text-blue-600'}`}>
                {(effectiveStatus === 'shipped' && (project.progress_percentage || 0) < 95) ? 95 : (project.progress_percentage || 0)}%
              </p>
            </div>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all shadow-sm"
              >
                <MessageCircle size={14} />
                Hubungi via WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-700 relative ${
              isPhysical ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${project.progress_percentage || 0}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="relative pt-2 border-t border-gray-100">
          <div className={`grid grid-cols-2 ${isPhysical ? 'sm:grid-cols-3 md:grid-cols-6' : 'sm:grid-cols-4'} gap-3 relative`}>
            {statusSteps.map((step, idx) => {
              const isDone = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={step.id} className="flex flex-col items-center text-center relative z-10 group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 shadow-sm ${
                    isDone
                      ? isPhysical ? 'bg-orange-500 text-white border-orange-500' : 'bg-blue-600 text-white border-blue-600'
                      : isCurrent
                      ? isPhysical ? 'bg-white text-orange-600 border-orange-500 ring-4 ring-orange-100' : 'bg-white text-blue-600 border-blue-600 ring-4 ring-blue-100'
                      : 'bg-white text-gray-300 border-gray-200'
                  }`}>
                    {isDone ? <CheckCircle size={14} className="text-white" /> : idx + 1}
                  </div>
                  <p className={`mt-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isCurrent ? (isPhysical ? 'text-orange-600' : 'text-blue-600') : isDone ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 hidden md:block ${isCurrent ? (isPhysical ? 'text-orange-400 font-medium' : 'text-blue-400 font-medium') : 'text-gray-400'}`}>
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION TABS */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-black/5 p-1.5 shadow-sm overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB: REVIEW MOCKUP (PHYSICAL AGENCY CORE TAB) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {isPhysical && activeTab === 'desain_fisik' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-black/5">
            {/* Header Box Review & Quota */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
              <div>
                <h2 className="font-extrabold text-lg md:text-xl text-gray-900 flex items-center gap-2">
                  <ImageIcon size={22} className="text-orange-500" /> Review Mockup & Approval Desain
                </h2>
                <p className="text-xs text-gray-400 mt-1">Review mockup visual sebelum pesanan masuk ke mesin cetak / produksi massal.</p>
              </div>

              {/* Revision Quota Badge */}
              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                <div className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                  isQuotaExceeded ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Revisi: {revisionCount} / {MAX_FREE_REVISIONS}x Standar
                </div>
              </div>
            </div>

            {/* Quota warning banner if >= 3 */}
            {isQuotaExceeded && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle size={15} /> Kuota Revisi Standar ({MAX_FREE_REVISIONS}x) Telah Digunakan
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Pengajuan revisi ke-{revisionCount + 1} dapat dikenakan biaya revisi ekstra sesuai kesepakatan dengan CS.
                  </p>
                </div>
                {waQuotaLink && (
                  <a
                    href={waQuotaLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
                  >
                    💬 Hubungi CS untuk Revisi Tambahan
                  </a>
                )}
              </div>
            )}

            {physicalRevFeedback && (
              <div className={`p-3.5 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 ${
                physicalRevFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {physicalRevFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {physicalRevFeedback.msg}
              </div>
            )}

            {/* 1. MOCKUP PREVIEW / LINK */}
            {pd.design_file_url ? (
              <div className="space-y-6 mb-8">
                <a
                  href={pd.design_file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50/80 to-amber-50/50 border border-orange-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="p-3.5 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl shadow-sm shrink-0">
                      <ImageIcon size={22} />
                    </div>
                    <div className="truncate">
                      <h3 className="font-extrabold text-sm md:text-base text-gray-900 group-hover:text-orange-600 transition-colors">
                        Buka Mockup Desain (Resolusi Penuh) ↗
                      </h3>
                      <p className="text-xs text-orange-700 font-mono truncate max-w-md mt-0.5">{pd.design_file_url}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-orange-600 px-4 py-2 bg-white rounded-xl border border-orange-200 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                    Buka Link →
                  </span>
                </a>

                {/* 2. CATATAN DARI DESAINER */}
                {(pd.design_notes || physicalDesignerNotes.length > 0) && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
                    <p className="font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-blue-600" /> Pesan / Catatan dari Tim Desainer:
                    </p>
                    <p className="text-blue-950 font-medium leading-relaxed pl-5">
                      {pd.design_notes || physicalDesignerNotes[physicalDesignerNotes.length - 1]?.content.replace('[Catatan Desainer] ', '')}
                    </p>
                  </div>
                )}

                {/* 3. DUA TOMBOL AKSI KLIEN (ACC vs MINTA REVISI) */}
                <div className="pt-2">
                  {!isAccApproved ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Tombol ACC */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('Apakah semua tulisan, warna, dan posisi logo sudah benar? Setelah di-ACC, pesanan akan langsung masuk mesin cetak dan tidak dapat diubah lagi.')) return
                            startApproveTransition(async () => {
                              await approveDesign(project.id)
                            })
                          }}
                          disabled={isApprovingDesign}
                          className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 group"
                        >
                          {isApprovingDesign ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                          <span>{isApprovingDesign ? 'Memproses ACC...' : '✅ ACC Desain — Lanjut ke Produksi'}</span>
                        </button>

                        {/* Tombol Minta Revisi */}
                        <button
                          type="button"
                          onClick={() => setShowPhysicalRevForm(prev => !prev)}
                          className="py-4 px-6 bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-rose-400 font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <Edit3 size={18} />
                          <span>{showPhysicalRevForm ? 'Tutup Form Revisi' : `✏️ Ajukan Revisi Mockup (#${revisionCount + 1})`}</span>
                        </button>
                      </div>

                      {/* Form Pengajuan Revisi Klien Fisik */}
                      {showPhysicalRevForm && (
                        <form onSubmit={handlePhysicalRevisionSubmit} className="bg-rose-50/70 border border-rose-200 p-5 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                                Catatan Revisi Mockup #{revisionCount + 1} <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[11px] font-bold text-rose-600">
                                {isQuotaExceeded ? 'Revisi Tambahan (Ekstra)' : `Sisa Kuota: ${Math.max(0, MAX_FREE_REVISIONS - revisionCount)}x`}
                              </span>
                            </div>
                            <textarea
                              name="revision_notes"
                              required
                              rows={3}
                              placeholder="Jelaskan secara spesifik detail yang ingin diubah (Contoh: Tolong warna tulisan nomor punggung diganti jadi putih, dan logo sponsor digeser ke atas 3cm)..."
                              className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500 transition-all resize-none shadow-inner"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowPhysicalRevForm(false)}
                              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingPhysicalRev}
                              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                              {isSubmittingPhysicalRev ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              {isSubmittingPhysicalRev ? 'Mengirim...' : 'Kirim Instruksi Revisi'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                      <div className="p-2 bg-emerald-500 text-white rounded-xl"><CheckCircle size={20} /></div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-900">Desain Telah Di-ACC & Siap Cetak</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">Mockup sudah dikonfirmasi dan pesanan sedang/telah dialihkan ke tim produksi.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl mb-8">
                <Clock size={36} className="mx-auto text-gray-300 mb-2" />
                <h3 className="text-sm font-bold text-gray-700">Mockup Sedang Dibuat Tim Desain</h3>
                <p className="text-xs text-gray-400 mt-1">Link review visual akan otomatis tampil di sini begitu desainer selesai membuat mockup.</p>
              </div>
            )}

            {/* 4. RIWAYAT LOG KOMUNIKASI & REVISI */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Riwayat Komunikasi & Log Revisi Desain</h3>
              
              <div className="space-y-2.5">
                {notes.filter((n: any) => n.visible_to_client || n.is_client_message).map((note: any) => {
                  const isClientRev = note.content.includes('[REVISI DARI KLIEN]')
                  const isAcc = note.content.includes('[ACC DARI KLIEN]')
                  const isDesigner = note.content.includes('[Catatan Desainer]')

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        isAcc ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' :
                        isClientRev ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
                        isDesigner ? 'bg-blue-50/70 border-blue-200 text-blue-950' :
                        'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[10px] uppercase tracking-wider">
                          {isAcc ? '✅ Konfirmasi ACC Klien' : isClientRev ? '🚨 Revisi dari Klien' : isDesigner ? '💬 Catatan Desainer' : '📝 Catatan Proyek'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(note.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p>{note.content.replace('[REVISI DARI KLIEN] ', '').replace('[ACC DARI KLIEN] ', '').replace('[Catatan Desainer] ', '')}</p>
                    </div>
                  )
                })}

                {notes.filter((n: any) => n.visible_to_client || n.is_client_message).length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-4 italic">Belum ada riwayat komunikasi revisi.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB: OVERVIEW PROYEK (DIGITAL & PHYSICAL) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* DIGITAL DELIVERABLES HERO */}
          {!isPhysical && (
            <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-black/5">
              <h2 className="font-extrabold text-lg text-gray-900 mb-1 flex items-center gap-2">
                <Monitor size={20} className="text-blue-600" /> Hasil Kerja & Live Deliverables
              </h2>
              <p className="text-xs text-gray-400 mb-6">Akses langsung hasil website, preview desain, dan rekaman demonstrasi sistem Anda.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Live Preview */}
                <a
                  href={previewUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-5 rounded-[16px] border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 transition-all flex flex-col justify-between group ${
                    !previewUrl ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm"><ExternalLink size={18} /></div>
                    <span className="text-xs font-extrabold text-blue-600 group-hover:translate-x-1 transition-transform">Buka Link →</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">Live Website / App</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{previewUrl || 'Belum ditautkan tim dev'}</p>
                  </div>
                </a>

                {/* Cloudinary Assets */}
                <a
                  href={linkCloudinary || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-5 rounded-[16px] border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/60 transition-all flex flex-col justify-between group ${
                    !linkCloudinary ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm"><ImageIcon size={18} /></div>
                    <span className="text-xs font-extrabold text-indigo-600 group-hover:translate-x-1 transition-transform">Buka Folder →</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">Folder Cloud / Drive</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{linkCloudinary || 'Folder cloud aset & gambar'}</p>
                  </div>
                </a>

                {/* YouTube Demo */}
                <a
                  href={linkYoutube || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-5 rounded-[16px] border border-rose-100 bg-rose-50/50 hover:bg-rose-100/60 transition-all flex flex-col justify-between group ${
                    !linkYoutube ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm"><Video size={18} /></div>
                    <span className="text-xs font-extrabold text-rose-600 group-hover:translate-x-1 transition-transform">Tonton Demo →</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">Video Demo / Tutorial</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{linkYoutube || 'Video penjelasan & review'}</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* DIGITAL ONLY: 2 KOLOM SEJAJAR (LOG REVISI + ASET PROYEK) - FOTO 1 */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {!isPhysical && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KOLOM KIRI: LOG REVISI */}
              <div className="bg-white p-6 md:p-7 rounded-[24px] shadow-sm border border-black/5 flex flex-col h-full">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                    <Bug size={20} className="text-rose-500" /> Log Revisi
                  </h3>
                  {warrantyExpiredAt && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      new Date() <= new Date(warrantyExpiredAt) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {new Date() <= new Date(warrantyExpiredAt) ? '🛡️ Garansi Aktif' : 'Garansi Habis'}
                    </span>
                  )}
                </div>

                {revFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
                    revFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {revFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {revFeedback.msg}
                  </div>
                )}

                {/* Form Input Revisi Instan */}
                <form onSubmit={handleRevisionSubmit} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Judul Revisi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="Contoh: Ubah Warna Header / Perbaikan Form"
                      className="w-full px-3.5 py-2.5 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Detail Revisi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      placeholder="Tolong ubah warna header menjadi biru tua (#00008B)..."
                      className="w-full px-3.5 py-2.5 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-rose-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingRev}
                    className="w-full py-3 bg-[#FF1744] hover:bg-[#D50000] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingRev ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                    {isSubmittingRev ? 'Mengirim...' : 'Ajukan Revisi'}
                  </button>
                </form>

                {/* Riwayat Revisi */}
                <div className="flex-grow space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Riwayat Pengajuan ({revisions.length})</h4>
                  {revisions.map((rev, idx) => (
                    <div key={rev.id} className="p-3.5 bg-gray-50 border border-black/5 rounded-xl text-xs">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase rounded-md border border-rose-100">
                            Revisi #{revisions.length - idx}
                          </span>
                          <h5 className="font-bold text-gray-900">{rev.title}</h5>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          rev.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          rev.status === 'On Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {rev.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 leading-relaxed">{rev.description}</p>
                      <p className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>

                      {rev.admin_reply && (
                        <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Balasan Tim Pengembang</p>
                          <p className="text-xs text-blue-950">{rev.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {revisions.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-6 italic">Belum ada revisi yang diajukan.</p>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: ASET PROYEK */}
              <div className="bg-white p-6 md:p-7 rounded-[24px] shadow-sm border border-black/5 flex flex-col h-full">
                <h3 className="font-extrabold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <UploadCloud size={20} className="text-indigo-600" /> Aset Proyek
                </h3>

                {assetFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
                    assetFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {assetFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {assetFeedback.msg}
                  </div>
                )}

                {/* Form Upload Aset Instan */}
                <form onSubmit={handleAssetSubmit} className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Nama File / Label</label>
                      <input
                        type="text"
                        name="asset_name"
                        required
                        placeholder="Contoh: Logo Vector / Konten Banner"
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Kategori File</label>
                      <select
                        name="asset_category"
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                      >
                        {activeCategories.map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      name="asset_notes"
                      placeholder="Contoh: Gunakan warna varian gelap..."
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Upload File</label>
                      <input
                        type="file"
                        name="asset_file"
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:font-bold cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Atau Link Google Drive</label>
                      <input
                        type="url"
                        name="asset_url"
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAsset}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                  >
                    {isSubmittingAsset ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isSubmittingAsset ? 'Mengupload...' : 'Upload Aset'}
                  </button>
                </form>

                {/* List Aset yang Diupload */}
                <div className="flex-grow space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Aset yang Anda Upload ({assets.length})</h4>
                  {assets.map((asset) => (
                    <div key={asset.id} className="p-3 bg-gray-50 border border-black/5 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0"><FileText size={15} /></div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">{asset.file_name}</p>
                            <p className="text-[10px] text-gray-400">
                              <span className="font-bold text-indigo-600">{asset.asset_category}</span> • {new Date(asset.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={asset.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white border border-black/10 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-all shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Download size={11} /> Buka
                        </a>
                      </div>
                      {asset.asset_notes && (
                        <p className="text-[11px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 italic">
                          📝 {asset.asset_notes}
                        </p>
                      )}
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-6 italic">Belum ada aset yang diupload.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* PHYSICAL ONLY: SPESIFIKASI & PENGIRIMAN EKSPEDISI */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {isPhysical && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Specs */}
              <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm">
                <h2 className="font-extrabold text-base text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-orange-500" /> Spesifikasi Pesanan Cetak
                </h2>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Jenis Barang</span>
                    <span className="font-extrabold text-gray-900">{pd.item_type || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Jumlah / Qty</span>
                    <span className="font-extrabold text-gray-900">{pd.quantity ? `${pd.quantity} pcs` : '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Ukuran</span>
                    <span className="font-bold text-gray-800">{pd.size_notes || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Bahan / Material</span>
                    <span className="font-bold text-gray-800">{pd.material_notes || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping info & Delivery Confirmation Actions */}
              <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-gray-900 mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-blue-500" /> Pengiriman & Resi
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400 font-bold">Ekspedisi / Kurir:</span>
                      <span className="font-extrabold text-gray-900">{pd.shipping_courier || 'Belum ditentukan'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400 font-bold">Nomor Resi:</span>
                      <span className="font-mono font-extrabold text-blue-600">{pd.tracking_number || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400 font-bold">Status Kirim:</span>
                      <span className="font-extrabold text-gray-800 uppercase text-[11px]">{pd.shipping_status || 'Menunggu Produksi'}</span>
                    </div>
                  </div>

                  {pd.shipping_address && (
                    <p className="text-[11px] text-gray-400 mt-3 bg-gray-50 p-2.5 rounded-xl">
                      📍 Alamat: <span className="text-gray-700 font-medium">{pd.shipping_address}</span>
                    </p>
                  )}
                </div>

                {/* Tombol Konfirmasi Diterima / Lapor Cacat jika SHIPPED */}
                {(effectiveStatus === 'shipped' || pd.shipping_status === 'SHIPPED') && project.status !== 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">Aksi Penerimaan Barang:</p>
                    
                    {defectFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        defectFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {defectFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {defectFeedback.msg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm('Apakah pesanan telah sampai dan kualitas cetak sudah sesuai? Setelah dikonfirmasi, proyek akan dinyatakan Selesai.')) return
                          startConfirmDeliveryTransition(async () => {
                            await clientConfirmDelivery(project.id)
                          })
                        }}
                        disabled={isConfirmingDelivery}
                        className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isConfirmingDelivery ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        <span>{isConfirmingDelivery ? 'Memproses...' : '✅ Pesanan Diterima'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDefectForm(prev => !prev)}
                        className="py-3 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle size={14} />
                        <span>{showDefectForm ? 'Tutup Form' : '⚠️ Lapor Cacat / Rusak'}</span>
                      </button>
                    </div>

                    {/* Form Komplain & Pengajuan Retur */}
                    {showDefectForm && (
                      <form onSubmit={handleDefectSubmit} className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-3 mt-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-xs">
                          <AlertTriangle size={14} className="text-rose-600" />
                          <span>Form Pengajuan Retur / Komplain Pesanan</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                              Jenis Kendala / Masalah <span className="text-rose-500">*</span>
                            </label>
                            <select
                              name="complaint_type"
                              required
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold outline-none focus:border-rose-500"
                            >
                              <option value="Cacat Sablon / Warna Pudar">🎨 Cacat Sablon / Warna Pudar</option>
                              <option value="Ukuran / Pola Tidak Sesuai">📐 Ukuran / Pola Tidak Sesuai</option>
                              <option value="Kain / Bahan Rusak / Robek">🧵 Kain / Bahan Rusak / Robek</option>
                              <option value="Jumlah / Kuantitas Kurang">📦 Jumlah / Kuantitas Kurang</option>
                              <option value="Salah Cetak Total / Salah Desain">❌ Salah Cetak Total / Desain Salah</option>
                              <option value="Lainnya">❓ Lainnya</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                              Solusi yang Diinginkan <span className="text-rose-500">*</span>
                            </label>
                            <select
                              name="solution_preference"
                              required
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-semibold outline-none focus:border-rose-500"
                            >
                              <option value="reship">🔄 Minta Cetak Ulang & Kirim Pengganti (Retur)</option>
                              <option value="refund">💰 Minta Pembatalan & Refund Dana (Cancel)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                            Rincian Kendala <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            name="defect_description"
                            required
                            rows={3}
                            placeholder="Jelaskan detail kerusakan (misal: sablon pada bagian dada buram, jahitan lengan sobek 5cm)..."
                            className="w-full p-2.5 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:border-rose-500 resize-none shadow-inner"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                              Link Video Unboxing (Google Drive / YouTube)
                            </label>
                            <input
                              type="url"
                              name="video_unboxing_url"
                              placeholder="https://drive.google.com/..."
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                              Foto Bukti Kerusakan (Opsional)
                            </label>
                            <input
                              type="file"
                              name="defect_photo"
                              accept="image/*"
                              className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-rose-600 file:text-white file:font-bold cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowDefectForm(false)}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingDefect}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            {isSubmittingDefect ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            <span>{isSubmittingDefect ? 'Mengirim...' : 'Kirim Pengajuan Retur'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Banner jika Klien Mengajukan Retur / Komplain */}
                {pd.shipping_status === 'RETURN_REQUESTED' && project.status !== 'completed' && project.status !== 'cancelled' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                    <p className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600" /> Pengajuan Komplain / Retur Sedang Diproses
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Laporan & bukti unboxing Anda telah diterima tim packing & CS. Tim agensi akan segera memverifikasi dan mengirimkan resi pengganti baru atau pengembalian dana.
                    </p>
                  </div>
                )}

                {/* Status jika DIBATALKAN / CANCELLED */}
                {project.status === 'cancelled' && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-rose-900">Pesanan Dibatalkan (Refund Selesai)</p>
                      <p className="text-[10px] text-rose-700">Pesanan telah dibatalkan dan pengembalian dana telah diproses oleh tim agensi.</p>
                    </div>
                  </div>
                )}

                {/* Status jika DELIVERED / COMPLETED */}
                {(effectiveStatus === 'completed' || pd.shipping_status === 'DELIVERED') && project.status !== 'cancelled' && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-extrabold text-emerald-900">Pesanan Telah Diterima</p>
                      <p className="text-[10px] text-emerald-700">Proyek selesai dan barang telah diterima dengan baik.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[20px] border border-black/5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Biaya Kontrak</p>
              <p className="text-xl font-extrabold text-gray-900">
                Rp {(project.total_price || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-[20px] border border-black/5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status Pembayaran</p>
              <p className={`text-base font-extrabold uppercase ${project.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {project.payment_status === 'paid' ? '✅ Lunas Penuh' : '🔄 Belum Lunas'}
              </p>
            </div>
            <div className="bg-white p-5 rounded-[20px] border border-black/5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Kontak Agensi</p>
              <p className="text-sm font-bold text-gray-900">{org?.name || 'Vylogix Agency'}</p>
              {org?.whatsapp_number && (
                <p className="text-xs text-blue-600 font-medium mt-0.5">WA: {org.whatsapp_number}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: TAGIHAN & INVOICE */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'tagihan' && (
        <div className="space-y-6">
          {(() => {
            const totalPaid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0)
            const totalPending = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'SPLIT_APPROVED').reduce((sum, inv) => sum + inv.amount, 0)

            return (
              <div className="bg-[#111827] text-white p-6 md:p-8 rounded-[24px] shadow-lg relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pusat Keuangan & Invoice</span>
                    <h2 className="text-2xl font-extrabold mt-1">Ringkasan Tagihan Proyek</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-xl text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Terbayar</p>
                      <p className="text-lg font-extrabold text-emerald-400">Rp {totalPaid.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Sisa Pending</p>
                      <p className="text-lg font-extrabold text-amber-400">Rp {totalPending.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                {/* List of Invoices */}
                <div className="space-y-3">
                  {invoices
                    .filter(inv => inv.status !== 'CANCELLED' && inv.status !== 'SPLIT_APPROVED')
                    .map(inv => (
                      <div
                        key={inv.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-[16px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-sm text-white">{inv.title}</span>
                            <span className="text-[10px] font-bold font-mono text-gray-400">({inv.invoice_number})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {inv.due_date && (
                              <span>Jatuh Tempo: {new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' :
                              inv.status === 'WAITING_CONFIRMATION' ? 'bg-blue-500/20 text-blue-300' :
                              inv.status === 'SPLIT_REQUESTED' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {inv.status === 'PAID' ? 'LUNAS' : inv.status === 'WAITING_CONFIRMATION' ? 'MENUNGGU VERIFIKASI' : inv.status === 'SPLIT_REQUESTED' ? 'PENGAJUAN CICILAN' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <p className="text-lg font-extrabold text-white">Rp {inv.amount.toLocaleString('id-ID')}</p>
                          <a
                            href={`/invoice/${inv.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            {inv.status === 'PAID' ? 'Lihat Bukti ↗' : 'Bayar & Detail ↗'}
                          </a>
                        </div>
                      </div>
                    ))}
                  {invoices.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-6">Belum ada invoice yang diterbitkan untuk proyek ini.</p>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DOMAIN, SERVER & GARANSI (DIGITAL AGENCY ONLY) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {!isPhysical && activeTab === 'teknis' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] p-6 md:p-8 rounded-[24px] text-white shadow-sm border border-black/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-extrabold text-lg flex items-center gap-2 text-emerald-400">
                <Server size={20} /> Informasi Teknis, Domain & Server
              </h2>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-emerald-500/30 w-fit">
                Infrastruktur Proyek
              </span>
            </div>

            {/* 4 Core Parameter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Card 1: Nama Domain */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Globe size={13} className="text-emerald-400" /> Nama Domain
                </p>
                {domainName ? (
                  <a 
                    href={domainName.startsWith('http') ? domainName : `https://${domainName}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-extrabold text-base text-emerald-400 hover:underline flex items-center gap-1 break-all"
                  >
                    {domainName} <ExternalLink size={13} className="shrink-0" />
                  </a>
                ) : (
                  <p className="font-semibold text-sm text-gray-400 italic">Belum dihubungkan</p>
                )}
              </div>

              {/* Card 2: Masa Aktif / Tanggal Expired Domain */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" /> Masa Aktif Domain
                </p>
                {domainExpiryDate ? (
                  <div>
                    <p className="font-bold text-sm text-amber-300">
                      {new Date(domainExpiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Jatuh Tempo Perpanjangan</p>
                  </div>
                ) : (
                  <p className="font-semibold text-sm text-gray-400 italic">Belum diatur</p>
                )}
              </div>

              {/* Card 3: Masa Garansi Proyek */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-blue-400" /> Durasi Garansi
                </p>
                {warrantyMonths > 0 ? (
                  <div>
                    <p className="font-extrabold text-base text-white">{warrantyMonths} Bulan</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Garansi Bug & Error</p>
                  </div>
                ) : (
                  <p className="font-semibold text-sm text-gray-400 italic">Standar / Tanpa Garansi</p>
                )}
              </div>

              {/* Card 4: Garansi Aktif Sampai */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" /> Batas Akhir Garansi
                </p>
                {warrantyExpiredAt ? (
                  <div>
                    <p className="font-bold text-sm text-emerald-400">
                      {new Date(warrantyExpiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Masa Perlindungan Aktif</p>
                  </div>
                ) : (
                  <p className="font-semibold text-sm text-gray-400 italic">Menunggu Serah Terima</p>
                )}
              </div>
            </div>

            {/* Live Preview / Staging URL (Jika Ada) */}
            {previewUrl && (
              <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Live Demo / Staging Preview</p>
                    <p className="text-sm font-semibold text-white truncate max-w-md">{previewUrl}</p>
                  </div>
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  Kunjungi Demo <ExternalLink size={14} />
                </a>
              </div>
            )}

            {/* Hosting Credentials Box */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Informasi Akses Panel / Hosting / Server</p>
              <div className="bg-black/50 p-5 rounded-2xl font-mono text-xs text-emerald-300/90 border border-white/10 whitespace-pre-wrap leading-relaxed shadow-inner">
                {hostingInfo || '// Informasi server / panel belum diinput oleh tim dev.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: MATERI CETAK (PHYSICAL AGENCY ONLY) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {isPhysical && activeTab === 'aset' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-black/5">
            <h2 className="font-extrabold text-lg text-gray-900 mb-1 flex items-center gap-2">
              <Upload size={20} className="text-indigo-600" /> Upload Materi & File Cetak
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Upload file siap cetak (AI, PDF Vector, TIFF, CDR) atau materi desain proyek Anda.
            </p>

            {assetFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
                assetFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {assetFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {assetFeedback.msg}
              </div>
            )}

            <form onSubmit={handleAssetSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Nama / Keterangan File</label>
                  <input
                    type="text"
                    name="asset_name"
                    required
                    placeholder="Contoh: Logo Utama High-Res..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Kategori File</label>
                  <select
                    name="asset_category"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                  >
                    {activeCategories.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  name="asset_notes"
                  placeholder="Contoh: Gunakan warna varian gelap ya..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Upload File Langsung</label>
                  <input
                    type="file"
                    name="asset_file"
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gray-900 file:text-white file:font-bold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Atau Link Google Drive / Cloud</label>
                  <input
                    type="url"
                    name="asset_url"
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmittingAsset}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingAsset ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isSubmittingAsset ? 'Mengupload...' : 'Upload ke Cloud Tim'}
              </button>
            </form>

            {/* Riwayat File yang Diunggah */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">File yang Sudah Anda Kirim</h3>
              <div className="space-y-2">
                {assets.map(asset => (
                  <div key={asset.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0"><FileText size={16} /></div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 truncate">{asset.file_name}</p>
                          <p className="text-[10px] text-gray-400">
                            <span className="font-bold text-indigo-600">{asset.asset_category}</span> • {new Date(asset.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={asset.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        <Download size={13} /> Buka / Unduh
                      </a>
                    </div>
                    {asset.asset_notes && (
                      <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 italic">
                        📝 Catatan: {asset.asset_notes}
                      </p>
                    )}
                  </div>
                ))}
                {assets.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-6">Belum ada materi/aset yang diupload.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
