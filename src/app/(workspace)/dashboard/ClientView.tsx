import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { logout } from '@/app/login/actions'
import { LogOut, Monitor, ExternalLink, Image as ImageIcon, MessageSquare, Video, FileText, Download, UploadCloud, Server, Bug, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react'
import AssetUploader from '@/components/AssetUploader'
import SubmitRevisionButton from '@/components/SubmitRevisionButton'
import { createRevision, accPhysicalDesign, requestPhysicalRevision, confirmPhysicalDelivery } from './actions'
import PhysicalClientSection from './PhysicalClientSection'

import Link from 'next/link'

export default async function ClientDashboard({ searchParams }: { searchParams?: { projectId?: string } | Promise<{ projectId?: string }> }) {
  const params = await Promise.resolve(searchParams || {})
  const supabase = await createClient()

  // Get current user securely
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all projects belonging to this client. 
  // RLS ensures they only see their own projects.
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles:client_id(email, full_name), project_digital_details(*), project_physical_details(*)')
    .eq('client_id', user?.id)
    .order('created_at', { ascending: false })

  let project = null
  if (projects && projects.length === 1) {
    project = projects[0]
  } else if (projects && projects.length > 1) {
    if (params.projectId) {
      project = projects.find(p => p.id === params.projectId) || null
    }
  }

  // Tipe data untuk organisasi — disesuaikan dengan schema baru
  type OrgData = {
    name: string
    whatsapp_number: string | null
    logo_url: string | null
  } | null

  let revisions: any[] = []
  let assets: any[] = []
  let invoices: any[] = []
  let organization: OrgData = null

  if (project) {
    const { data: revData } = await supabase
      .from('project_revisions')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    revisions = revData || []

    const { data: assetData } = await supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    assets = assetData || []

    const { data: invData } = await supabase
      .from('fin_invoices')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    invoices = invData || []

    // Ambil data org untuk tombol WA dan invoice
    // Hanya kolom yang ada di schema baru
    if (project.organization_id) {
      const supabaseAdmin = createAdminClient()
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('name, whatsapp_number, logo_url')
        .eq('id', project.organization_id)
        .single()
      organization = orgData
    }
    // Catatan: suspend check sudah dihandle sepenuhnya oleh middleware.
    // Tidak perlu cek ulang di sini — middleware sudah blokir admin yang suspended
    // sebelum halaman ini pernah dirender.
  }

  // Extract digital details if available
  const digitalDetails = project?.project_digital_details && Array.isArray(project.project_digital_details) 
    ? project.project_digital_details[0] 
    : project?.project_digital_details || {};

  // Extract physical details if available
  const physicalDetails = project?.project_physical_details && Array.isArray(project.project_physical_details)
    ? project.project_physical_details[0]
    : project?.project_physical_details || null;

  const isPhysical = project?.project_category === 'PHYSICAL'

  const previewUrl = digitalDetails?.preview_url || project?.preview_url;
  const linkCloudinary = digitalDetails?.link_cloudinary || project?.link_cloudinary;
  const linkYoutube = digitalDetails?.link_youtube || project?.link_youtube;
  const domainName = digitalDetails?.domain_name || project?.domain_name;
  const hostingInfo = digitalDetails?.hosting_info || project?.hosting_info;
  const domainExpiryDate = digitalDetails?.domain_expiry_date || project?.domain_expiry_date;
  const warrantyExpiredAt = digitalDetails?.warranty_expired_at || project?.warranty_expired_at;
  const warrantyMonths = digitalDetails?.warranty_months || project?.warranty_months || 0;


  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {projects && projects.length > 1 && !project ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300 mt-4">
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-[#111827]">Pilih Proyek</h2>
              <p className="text-sm text-[#4B5563]">Anda memiliki beberapa proyek. Pilih salah satu untuk melihat detailnya.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <Link key={p.id} href={`/dashboard?projectId=${p.id}`} className="block group">
                  <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
                    <div>
                      <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                        {p.service_type}
                      </div>
                      <h3 className="font-extrabold text-lg text-[#111827] mb-2 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Status: <span className="uppercase text-gray-700">{p.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-900">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.total_price || 0)}
                      </span>
                      <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Buka Proyek →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : project ? (
          <div className="space-y-6 mt-4">
            {projects && projects.length > 1 && (
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#2563EB] px-4 py-2.5 bg-white border border-black/10 rounded-[12px] hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                ← Kembali ke Daftar Proyek
              </Link>
            )}

            {/* Project Status Card */}
            <div className="bg-white p-6 md:p-8 rounded-[20px] shadow-sm border border-black/5 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                <div>
                  <div className="inline-block px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                    {project.service_type}
                  </div>
                  <h2 className="font-extrabold text-3xl text-[#111827] font-['Plus_Jakarta_Sans'] mb-1">{project.title}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm font-medium text-[#4B5563]">
                    {project.updated_at && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></span>
                        Terakhir diperbarui: <span className="font-bold text-[#111827]">{new Date(project.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1">Progress</p>
                  <p className="text-4xl font-extrabold text-[#2563EB]">{project.progress_percentage}%</p>
                </div>
              </div>

              {/* Premium Stepper */}
              <div className="relative mt-10 mb-6">
                <div className="absolute top-[22px] left-[12.5%] right-[12.5%] h-1 bg-gray-100 rounded-full hidden md:block"></div>
                <div 
                  className="absolute top-[22px] left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full hidden md:block transition-all duration-1000 ease-out"
                  style={{ width: `${project.progress_percentage}%`, maxWidth: '100%' }}
                ></div>

                {isPhysical ? (
                  // Physical Stepper — 6 tahap
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 relative">
                    {[
                      { id: 'briefing', label: 'Brief', desc: 'Pengumpulan Data' },
                      { id: 'design', label: 'Desain', desc: 'Proses Desain' },
                      { id: 'production', label: 'Produksi', desc: 'Proses Cetak' },
                      { id: 'ready_to_ship', label: 'Packing', desc: 'Siap Kirim' },
                      { id: 'shipped', label: 'Pengiriman', desc: 'Dalam Perjalanan' },
                      { id: 'completed', label: 'Selesai', desc: 'Pesanan Tiba' },
                    ].map((step, idx) => {
                      const physMap: Record<string, number> = {
                        'briefing': 0, 'design': 1, 'revision': 1, 'revision_pending': 1,
                        'production': 2, 'production_in_progress': 2, 'finishing': 2, 'qc_pending': 2,
                        'ready_to_ship': 3, 'shipped': 4, 'completed': 5
                      }
                      const currentIndex = physMap[project.status] ?? 0
                      const stepState = idx < currentIndex ? 'completed' : idx === currentIndex ? 'active' : 'upcoming'
                      return (
                        <div key={idx} className="flex flex-col items-center text-center relative z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-4 transition-all duration-500 shadow-sm
                            ${stepState === 'completed' ? 'bg-gradient-to-br from-orange-500 to-pink-600 text-white border-orange-100 shadow-orange-500/30' : 
                              stepState === 'active' ? 'bg-white text-orange-600 border-orange-500 shadow-orange-500/20' : 
                              'bg-white text-gray-300 border-gray-100'}`}
                          >
                            {stepState === 'completed' ? (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : idx + 1}
                          </div>
                          <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${stepState === 'active' ? 'text-orange-600' : 'text-gray-400'}`}>{step.label}</p>
                          <p className={`text-[9px] mt-0.5 hidden md:block ${stepState === 'active' ? 'text-orange-400' : 'text-gray-300'}`}>{step.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Digital Stepper — 4 tahap
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                    {(project.status.startsWith('update_')
                      ? [
                          { id: 'update_pengajuan', label: 'Pengajuan', desc: 'Permintaan Masuk' },
                          { id: 'maintenance', label: 'Maintenance', desc: 'Pengerjaan Tim' },
                          { id: 'update_deploy', label: 'Deploy', desc: 'Tayang ke Server' },
                          { id: 'completed', label: 'Selesai', desc: 'Bisa Dicek Klien' }
                        ]
                      : [
                          { id: 'briefing', label: 'Briefing', desc: 'Pengumpulan Data' },
                          { id: 'design', label: 'Design', desc: 'Pembuatan Mockup' },
                          { id: 'development', label: 'Development', desc: 'Proses Coding' },
                          { id: 'completed', label: 'Completed', desc: 'Proyek Selesai' }
                        ]
                    ).map((step, idx) => {
                      let currentIndex = 0;
                      if (project.status.startsWith('update_') || project.status === 'maintenance') {
                        const map: Record<string, number> = { 'update_pengajuan': 0, 'maintenance': 1, 'update_deploy': 2, 'completed': 3 };
                        currentIndex = map[project.status] ?? 0;
                      } else {
                        const map: Record<string, number> = { 'briefing': 0, 'design': 1, 'development': 2, 'revision': 2, 'revision_pending': 2, 'completed': 3 };
                        currentIndex = map[project.status] ?? 0;
                      }
                      const stepState = idx < currentIndex ? 'completed' : idx === currentIndex ? 'active' : 'upcoming'
                      return (
                        <div key={idx} className="flex flex-col items-center text-center relative z-10 group">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-500 shadow-sm
                            ${stepState === 'completed' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-100 shadow-blue-500/30' : 
                              stepState === 'active' ? 'bg-white text-blue-600 border-blue-500 shadow-blue-500/20' : 
                              'bg-white text-gray-300 border-gray-100'}`}
                          >
                            {stepState === 'completed' ? (
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : idx + 1}
                          </div>
                          <p className={`mt-3 text-xs font-bold uppercase tracking-wider transition-colors ${stepState === 'active' ? 'text-blue-600' : 'text-gray-500'}`}>{step.label}</p>
                          <p className={`text-[10px] mt-1 hidden md:block ${stepState === 'active' ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>{step.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ===== PHYSICAL PROJECT SECTIONS ===== */}
            {isPhysical && (
              <PhysicalClientSection
                project={project}
                physicalDetails={physicalDetails}
                accPhysicalDesign={accPhysicalDesign}
                requestPhysicalRevision={requestPhysicalRevision}
                confirmPhysicalDelivery={confirmPhysicalDelivery}
              />
            )}

            <div className={`grid grid-cols-1 ${!isPhysical ? 'md:grid-cols-2' : ''} gap-6`}>
              {/* Asset & Preview Section — Digital only */}
              {!isPhysical && (
              <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 flex flex-col h-full">
                <h3 className="font-bold text-lg text-[#111827] mb-4 flex items-center gap-2">
                  <Monitor size={20} className="text-[#2563EB]" /> Hasil & Aset Proyek
                </h3>
                <div className="space-y-3 flex-grow">
                  <a href={previewUrl || '#'} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 rounded-[12px] border border-black/5 hover:border-[#2563EB]/30 transition-all ${!previewUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#4B5563]"><ExternalLink size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">Live Preview</p>
                        <p className="text-xs text-[#4B5563]">Lihat hasil website / desain</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">Buka Link</span>
                  </a>
                  <a href={linkCloudinary || '#'} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 rounded-[12px] border border-black/5 hover:border-[#2563EB]/30 transition-all ${!linkCloudinary ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#4B5563]"><ImageIcon size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">Aset Cloudinary</p>
                        <p className="text-xs text-[#4B5563]">Folder gambar & desain</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">Buka Link</span>
                  </a>
                  <a href={linkYoutube || '#'} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 rounded-[12px] border border-black/5 hover:border-[#2563EB]/30 transition-all ${!linkYoutube ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#4B5563]"><Video size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">Video Draft</p>
                        <p className="text-xs text-[#4B5563]">Preview di YouTube</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB]">Buka Link</span>
                  </a>
                </div>
              </div>
              )}

              {/* Invoice Section */}
              <div className="bg-[#111827] text-white p-6 rounded-[20px] shadow-md relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Monitor size={100} />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-white/70 mb-4">Informasi Pembayaran</h3>
                
                {/* Smart Termin Logic from Invoices */}
                {(() => {
                  const totalPaid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
                  const totalPending = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED').reduce((sum, inv) => sum + inv.amount, 0);
                  const sisaTotalBiaya = Math.max(0, project.total_price - totalPaid);

                  return (
                    <>
                      <div className="mb-4 relative z-10 flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider mb-1">Total Terbayar</p>
                          <p className="text-2xl font-extrabold text-emerald-400">
                            Rp {totalPaid.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider mb-1">Total Tagihan (Pending)</p>
                          <p className="text-xl font-extrabold text-amber-400">
                            Rp {totalPending.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 mb-4 relative z-10">
                        <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider mb-2 border-b border-white/10 pb-1">Daftar Tagihan (Invoice)</p>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                          {invoices.filter(inv => inv.status !== 'CANCELLED' && inv.status !== 'SPLIT_APPROVED').map((inv) => (
                            <div key={inv.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                              <div>
                                <div className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[120px]" title={inv.title}>{inv.title}</div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  {inv.due_date && (
                                    <span className="text-[9px] font-medium text-white/50">Jatuh Tempo: {new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  )}
                                  <a href={`/invoice/${inv.id}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 font-bold inline-block">
                                    {inv.status === 'PENDING' ? 'Bayar & Upload Bukti ↗' : 'Lihat Invoice ↗'}
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-extrabold">Rp {inv.amount.toLocaleString('id-ID')}</div>
                                <div className={`text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${inv.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {inv.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                </div>
                              </div>
                            </div>
                          ))}
                          {invoices.filter(inv => inv.status !== 'CANCELLED').length === 0 && (
                            <div className="text-center p-3 border border-white/10 rounded-lg bg-white/5 text-[10px] font-medium text-white/50">
                              Belum ada tagihan.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/10 relative z-10">
                        <div>
                          <p className="text-xs text-white/70 mb-1">Status Proyek</p>
                          <p className={`text-sm font-bold uppercase ${project.payment_status === 'paid' || totalPaid >= project.total_price && project.total_price > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {project.payment_status === 'paid' || totalPaid >= project.total_price && project.total_price > 0 ? 'LUNAS' : 'BELUM LUNAS'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/70 mb-1 text-right">Total Biaya Proyek</p>
                          <p className="text-sm font-bold">Rp {project.total_price.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Domain Info Card */}
            {(project.project_category === 'DIGITAL' || project.service_class === 'website') && (domainName || hostingInfo || warrantyMonths > 0 || warrantyExpiredAt) && (
              <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] p-6 md:p-8 rounded-[20px] shadow-sm border border-black/5 text-white">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Server size={20} className="text-emerald-400" /> Informasi Teknis & Garansi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {domainName && (
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Nama Domain</p>
                      <p className="font-medium">{domainName}</p>
                    </div>
                  )}
                  {domainExpiryDate && (
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Domain Expired Pada</p>
                      <p className="font-medium">{new Date(domainExpiryDate).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                  {warrantyMonths > 0 && (
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Masa Garansi</p>
                      <p className="font-medium">{warrantyMonths} Bulan</p>
                    </div>
                  )}
                  {warrantyExpiredAt && (
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Garansi Aktif Sampai</p>
                      <p className="font-medium">{new Date(warrantyExpiredAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                  {hostingInfo && (
                    <div className="sm:col-span-3">
                      <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-2">Informasi Hosting / Panel</p>
                      <div className="bg-black/30 p-4 rounded-[12px] font-mono text-xs whitespace-pre-wrap text-white/80 border border-white/10">
                        {hostingInfo}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bagian Khusus DIGITAL: Log Revisi & Upload Aset Digital */}
            {!isPhysical && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Revision / Bug Report Section */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5">
                  <h3 className="font-bold text-lg text-[#111827] mb-4 flex items-center gap-2">
                    {project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_') ? (
                      <><Bug size={20} className="text-rose-500" /> Ajukan Update / Revisi 
                        <span className="text-sm font-normal ml-2">
                          {warrantyExpiredAt && new Date() <= new Date(warrantyExpiredAt) 
                            ? `(Garansi Aktif s/d ${new Date(warrantyExpiredAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`
                            : ''}
                        </span>
                      </>
                    ) : (
                      <><MessageSquare size={20} className="text-rose-500" /> Log Revisi</>
                    )}
                  </h3>
                  
                  <form action={async (formData) => {
                    'use server'
                    await createRevision(formData)
                  }} className="mb-6 space-y-4">
                    <input type="hidden" name="projectId" value={project.id} />
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">
                        {project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_') ? 'Judul Permintaan Update / Revisi' : 'Judul Revisi'}
                      </label>
                      <input type="text" name="title" required placeholder={project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_') ? "Contoh: Update gambar banner / Perbaikan error" : "Contoh: Ubah Warna Header"} className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-rose-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">
                        {project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_') ? 'Detail Update / Perbaikan yang Diinginkan' : 'Detail Revisi'}
                      </label>
                      <textarea name="description" required rows={3} placeholder={project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_') ? "Jelaskan secara detail bagian mana yang ingin diubah atau diperbaiki..." : "Tolong ubah warna header menjadi biru tua (#00008B)..."} className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-rose-500 outline-none transition-all resize-none"></textarea>
                    </div>
                    <SubmitRevisionButton isUpdateMode={project.status === 'completed' || project.status === 'maintenance' || project.status.startsWith('update_')} />
                  </form>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {revisions.map((rev, index) => {
                      const nomorRevisi = revisions.length - index;
                      return (
                        <div key={rev.id} className="p-4 bg-[#F8F9FA] border border-black/5 rounded-[12px]">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-extrabold uppercase rounded-md border border-rose-100">
                                Revisi #{nomorRevisi}
                              </span>
                              <h4 className="font-bold text-[#111827] text-sm">{rev.title}</h4>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                              rev.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                              rev.status === 'On Progress' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-rose-500/10 text-rose-600'
                            }`}>
                              {rev.status}
                            </span>
                          </div>
                          <p className="text-[#4B5563] text-xs mb-3">{rev.description}</p>
                          <div className="text-[10px] font-bold text-[#6B7280]">
                            {new Date(rev.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                          {rev.admin_reply && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Balasan Admin</div>
                              <p className="text-xs text-blue-900">{rev.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {revisions.length === 0 && (
                      <p className="text-xs text-center text-[#6B7280] italic">Belum ada revisi yang diajukan.</p>
                    )}
                  </div>
                </div>

                {/* Upload Asset Section */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm border border-black/5 flex flex-col h-full">
                  <h3 className="font-bold text-lg text-[#111827] mb-4 flex items-center gap-2">
                    <UploadCloud size={20} className="text-indigo-500" /> Aset Proyek
                  </h3>
                  <AssetUploader projectId={project.id} />
                  
                  <div className="mt-6 flex-grow space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-3">Aset yang Anda Upload</h4>
                    {assets.map((asset) => (
                      <div key={asset.id} className="p-3 bg-[#F8F9FA] border border-black/5 rounded-[12px] space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText size={16} className="text-indigo-500 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-[#111827] truncate block">{asset.file_name}</span>
                              {asset.asset_category && (
                                <span className="text-[10px] text-indigo-600 font-bold">{asset.asset_category}</span>
                              )}
                            </div>
                          </div>
                          <a href={asset.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white border border-black/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-[#111827] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex-shrink-0">
                            <Download size={12} /> Buka
                          </a>
                        </div>
                        {asset.asset_notes && (
                          <p className="text-[11px] text-[#4B5563] bg-white p-2 rounded-lg border border-black/5 italic">
                            📝 {asset.asset_notes}
                          </p>
                        )}
                      </div>
                    ))}
                    {assets.length === 0 && (
                      <p className="text-xs text-center text-[#6B7280] italic py-3">Belum ada aset yang diupload.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            

          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-[20px] shadow-sm border border-black/5">
            <Monitor size={48} className="mx-auto text-black/20 mb-4" />
            <h2 className="font-bold text-xl text-[#111827] mb-2">Belum Ada Proyek</h2>
            <p className="text-[#4B5563] text-sm">Admin belum membuatkan atau menugaskan proyek untuk akun Anda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
