import Link from 'next/link'
import { updateProjectDetails, deleteProjectAsset, replyToRevision } from '@/app/(workspace)/dashboard/actions'
import { ArrowLeft, Save, Briefcase, User, Monitor, DollarSign, Link as LinkIcon, FileText, Download, Server, Trash2, CheckCircle, Package, XCircle, Clock } from 'lucide-react'
import CurrencyInput from '@/components/CurrencyInput'
import RevisionStatusSelect from '@/components/RevisionStatusSelect'
import InternalNotes from './InternalNotes'
import DigitalProjectSection from './DigitalProjectSection'
import PhysicalProjectSection from './PhysicalProjectSection'
import InstallmentScheduler from './InstallmentScheduler'
import BackButton from './BackButton'

// ─────────────────────────────────────────────────────────────────────────────
// Tipe data untuk detail proyek berdasarkan kategori
// ─────────────────────────────────────────────────────────────────────────────
type ProjectCategory = 'DIGITAL' | 'PHYSICAL'

export default function ActiveProjectView({ 
  project, 
  revisions, 
  assets, 
  organization,
  invoices = [],
  internalNotes = [],
  currentUserId,
  userRole,
  digitalDetails = null,
  physicalDetails = null,
}: { 
  project: any, 
  revisions: any[], 
  assets: any[], 
  organization: any,
  invoices?: any[],
  internalNotes?: any[],
  currentUserId?: string,
  userRole?: string,
  digitalDetails?: any,
  physicalDetails?: any,
}) {
  const isExecutor = ['staff_executor', 'staff_digital', 'staff_physical', 'staff_design', 'staff_production', 'staff_warehouse', 'staff_shipping'].includes(userRole || '')
  const isFinance  = userRole === 'staff_finance'
  const isShippingStaff = userRole === 'staff_shipping'
  const isOpsOrAdmin = ['super_admin', 'admin', 'staff_ops'].includes(userRole || '')
  const isCsRestricted = userRole === 'staff_cs'
  const isDesign = userRole === 'staff_design'
  const isProduction = userRole === 'staff_production'
  const totalPaid  = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0)

  // ─────────────────────────────────────────────────────────────────────────
  // Registry: tentukan komponen form mana yang akan di-render
  // berdasarkan project_category. Tidak ada if-else raksasa.
  // ─────────────────────────────────────────────────────────────────────────
  const projectCategory = project.project_category ?? 'DIGITAL'
  const isMaintenanceMode = project.status === 'maintenance'
  const isUpdateMode = project.status.startsWith('update_') || isMaintenanceMode
  const isReadOnly = project.status === 'completed'

  const categoryLabel = {
    DIGITAL:  '🎨 Digital / Kreatif',
    PHYSICAL: '📦 Barang Fisik',
  }

  const categoryBadgeClass = {
    DIGITAL:  'bg-[#EFF6FF] text-[#2563EB]',
    PHYSICAL: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <BackButton userRole={userRole} isReadOnly={isReadOnly} />
          <h2 className="font-extrabold text-xl text-[#111827]">
            {project.status === 'completed' || isExecutor ? 'Detail Proyek' : 'Kelola Proyek'}
          </h2>
        </div>
        
        {!isExecutor && !isFinance && !isReadOnly && (
          <div className="flex items-center gap-3">
            <form action={async () => {
              'use server'
              const { updateProjectStatus } = await import('@/app/(workspace)/dashboard/actions')
              await updateProjectStatus(project.id, 'batal', 0)
            }}>
              <button type="submit" className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-[12px] text-xs font-bold transition-all shadow-sm border border-rose-200">
                <XCircle size={16} /> Batalkan Proyek
              </button>
            </form>

            <form action={async () => {
              'use server'
              const { updateProjectStatus } = await import('@/app/(workspace)/dashboard/actions')
              await updateProjectStatus(project.id, 'completed', 100)
            }}>
              <button type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-[12px] text-xs font-bold transition-all shadow-sm">
                <CheckCircle size={16} /> Tandai Proyek Selesai
              </button>
            </form>
          </div>
        )}
      </div>

      {!isShippingStaff && (
      <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
        {/* Header Proyek */}
        <div className="p-6 md:p-8 border-b border-black/5 bg-[#F8F9FA]/50">
          <div className="flex items-center gap-2 mb-3">
            <div className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${categoryBadgeClass[projectCategory as ProjectCategory]}`}>
              {categoryLabel[projectCategory as ProjectCategory]}
            </div>
            <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
              {project.service_type}
            </div>
          </div>
          <h1 className="font-extrabold text-3xl text-[#111827] font-['Plus_Jakarta_Sans'] mb-2">{project.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[#4B5563] text-sm font-medium">
            <div className="flex items-center gap-2">
              <User size={16} /> Klien: <span className="font-bold text-[#111827]">{project.profiles?.full_name || project.profiles?.email}</span>
              {project.profiles?.whatsapp_number && (
                <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 font-bold">
                  WA: {project.profiles.whatsapp_number}
                </span>
              )}
            </div>
            {project.updated_at && (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></span>
                Terakhir diperbarui: {new Date(project.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <form action={async (formData) => {
          'use server'
          if (!isReadOnly) {
            const { updateProjectDetails } = await import('@/app/(workspace)/dashboard/actions')
            await updateProjectDetails(project.id, formData)
          }
        }} className="space-y-6">
          <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
          
              {/* ── Status & Progress ── */}
              {!isShippingStaff && (
              <>
              {!isFinance ? (
                <div>
                  <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
                    <Monitor size={18} className="text-[#2563EB]" /> Progress & Tahapan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Tahapan (Status)</label>
                      {isReadOnly || isCsRestricted || isExecutor ? (
                        <>
                          <div className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-[#111827]">
                            {project.status.toUpperCase()}
                          </div>
                          {!isReadOnly && <input type="hidden" name="status" value={project.status} />}
                        </>
                      ) : (
                        <select name="status" defaultValue={project.status} className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] cursor-pointer transition-all">
                          {isUpdateMode ? (
                            <>
                              <option value="update_pengajuan">Dalam Pengajuan</option>
                              <option value="maintenance">Maintenance (Proses Update)</option>
                              <option value="update_deploy">Deploy</option>
                              <option value="completed">Selesai/Bisa di Cek Klien</option>
                            </>
                          ) : (
                            <>
                              <option value="briefing">Briefing</option>
                              <option value="design">Design</option>
                              <option value="development">Development</option>
                              <option value="revision">Revision</option>
                              <option value="revision_pending">Menunggu Revisi</option>
                              <option value="qc_pending">Quality Control</option>
                              <option value="production">Produksi</option>
                              <option value="completed">Completed</option>
                            </>
                          )}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Progress (%)</label>
                      <div className="flex items-center gap-3">
                        {isReadOnly || isCsRestricted || isExecutor ? (
                          <>
                            <div className="w-20 px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-[#111827] text-center">
                              {project.progress_percentage}
                            </div>
                            {!isReadOnly && <input type="hidden" name="progress" value={project.progress_percentage} />}
                          </>
                        ) : (
                          <input type="number" name="progress" min="0" max="100" defaultValue={project.progress_percentage} className="w-20 px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold focus:border-[#2563EB] outline-none transition-all" />
                        )}
                        <div className="flex-1 h-3 bg-black/5 rounded-full overflow-hidden min-w-[50px]">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${project.progress_percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-2">Tenggat Waktu</label>
                      {isReadOnly || !isOpsOrAdmin ? (
                        <>
                          <div className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-bold text-[#111827]">
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </div>
                          {!isReadOnly && (
                            <input type="hidden" name="deadline" value={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''} />
                          )}
                        </>
                      ) : (
                        <input type="date" name="deadline" defaultValue={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''} className="w-full px-4 py-3 bg-[#F8F9FA] border border-black/10 rounded-[12px] text-sm font-medium focus:border-[#2563EB] outline-none text-[#111827] cursor-pointer transition-all" />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input type="hidden" name="status"   value={project.status} />
                  <input type="hidden" name="progress" value={project.progress_percentage} />
                  <input type="hidden" name="deadline" value={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''} />
                </>
              )}

              {/* ── Keuangan & Pembayaran ── */}
              {!isExecutor && !isDesign ? (
                <div>
                  <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
                    <DollarSign size={18} className="text-emerald-500" /> Keuangan & Pembayaran
                  </h3>
                  
                  {isUpdateMode ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                        <CurrencyInput name="totalPrice" defaultValue={project.total_price} label="Harga Kontrak Awal (Terkunci)" readOnly={true} />
                        
                        {!isReadOnly ? (
                          <div className="flex flex-col">
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <CurrencyInput name="updatePrice" defaultValue={project.update_price || 0} label="Biaya Tambahan (Update)" readOnly={false} />
                              </div>
                              <button 
                                formAction={async (formData) => {
                                  'use server'
                                  const { updateProjectUpdatePrice } = await import('@/app/(workspace)/dashboard/actions')
                                  const rawVal = formData.get('updatePrice')
                                  const val = parseInt(String(rawVal)?.replace(/\D/g, '')) || 0
                                  await updateProjectUpdatePrice(project.id, val)
                                }}
                                type="submit" 
                                className="h-[46px] w-[46px] mb-[2px] bg-[#111827] hover:bg-[#1f2937] text-white rounded-[12px] flex items-center justify-center shadow-sm transition-colors" 
                                title="Simpan Biaya Tambahan"
                              >
                                <CheckCircle size={20} className="text-emerald-400" />
                              </button>
                            </div>
                            <p className="text-[10px] text-[#6B7280] mt-1">Klik icon centang untuk menyimpan biaya khusus bagian ini.</p>
                          </div>
                        ) : (
                          <CurrencyInput name="updatePrice" defaultValue={project.update_price || 0} label="Biaya Tambahan (Update)" readOnly={true} />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                        <CurrencyInput name="totalPrice" defaultValue={project.total_price} label="Total Harga" readOnly={isReadOnly} />
                      </div>
                    </>
                  )}

                  {!(project.status === 'completed' || project.status === 'selesai') && (
                    <div className="mt-8">
                      <InstallmentScheduler 
                        projectId={project.id} 
                        clientId={project.client_id} 
                        invoices={invoices} 
                        totalProjectPrice={project.total_price || 0} 
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input type="hidden" name="totalPrice" value={project.total_price || 0} />
                  <input type="hidden" name="termin1" value={project.termin_1 || 0} />
                  <input type="hidden" name="termin2" value={project.termin_2 || 0} />
                  <input type="hidden" name="termin3" value={project.termin_3 || 0} />
                </>
              )}
              </>
              )}

              {/* ── Section Dinamis berdasarkan Kategori Proyek ── */}
              {!isFinance && !isDesign && (
                <div>
                  {projectCategory === 'DIGITAL' && (
                    <DigitalProjectSection
                      details={digitalDetails}
                      isFinance={isFinance}
                      isExecutor={isExecutor}
                      serviceType={project.service_type}
                      serviceClass={project.service_class}
                      isReadOnly={isReadOnly}
                      isUpdateMode={isUpdateMode}
                    />
                  )}
                  {projectCategory === 'PHYSICAL' && (
                    <PhysicalProjectSection
                      details={physicalDetails}
                      isFinance={isFinance}
                      isExecutor={isExecutor}
                      isReadOnly={isReadOnly}
                      isCsRestricted={isCsRestricted}
                      userRole={userRole}
                      internalNotes={internalNotes}
                    />
                  )}
                </div>
              )}

              {isFinance && (
                <>
                  {projectCategory === 'DIGITAL' && (
                    <DigitalProjectSection details={digitalDetails} isFinance={true} isExecutor={false} serviceType={project.service_type} />
                  )}
                  {projectCategory === 'PHYSICAL' && (
                    <PhysicalProjectSection details={physicalDetails} isFinance={true} isExecutor={false} isReadOnly={isReadOnly} internalNotes={internalNotes} />
                  )}
                </>
              )}

              <input type="hidden" name="projectCategory" value={projectCategory} />

            </div>
          </div>
          
          {!isReadOnly && !isExecutor && (
            <div className="px-6 md:px-8 py-5 border-t border-black/5 bg-[#F8F9FA]/50 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#2563EB] text-white font-bold px-8 py-3.5 rounded-[12px] hover:bg-[#1D4ED8] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Save size={18} /> Simpan Semua Perubahan
              </button>
            </div>
          )}
        </form>

      {/* Catatan Internal Tim */}
      {currentUserId && !isReadOnly && !isShippingStaff && (
        <InternalNotes 
          projectId={project.id} 
          notes={internalNotes} 
          currentUserId={currentUserId} 
        />
      )}

      {/* Daftar Revisi Klien */}
      {!isFinance && !isShippingStaff && (
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 md:p-8">
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
            <FileText size={18} className="text-rose-500" /> Daftar Revisi Klien
          </h3>
          {revisions && revisions.length > 0 ? (
            <div className="space-y-4">
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
                      <RevisionStatusSelect revisionId={rev.id} currentStatus={rev.status} isReadOnly={isReadOnly} />
                    </div>
                    <p className="text-[#4B5563] text-xs mb-3">{rev.description}</p>
                    <div className="text-[10px] font-bold text-[#6B7280]">
                      Diajukan pada: {new Date(rev.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    
                    {rev.admin_reply ? (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Balasan Admin</div>
                        <p className="text-xs text-blue-900">{rev.admin_reply}</p>
                      </div>
                    ) : !isReadOnly && (
                      <form action={async (formData) => {
                        'use server'
                        await replyToRevision(formData)
                      }} className="mt-4 border-t border-black/5 pt-4">
                        <input type="hidden" name="revisionId" value={rev.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <textarea name="adminReply" required rows={2} placeholder="Tulis tanggapan atau konfirmasi perbaikan..." className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs font-medium focus:border-[#2563EB] outline-none transition-all resize-none mb-2"></textarea>
                        <button type="submit" className="text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-lg transition-all">
                          Kirim Balasan
                        </button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[#4B5563] italic bg-[#F8F9FA] p-4 rounded-[12px] text-center border border-black/5">
              Belum ada revisi yang diajukan oleh klien.
            </p>
          )}
        </div>
      )}

      {/* Daftar Aset Klien */}
      {!isDesign && !isShippingStaff && (
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 md:p-8">
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2 border-b border-black/5 pb-2">
            <Download size={18} className="text-indigo-500" /> Aset dari Klien
          </h3>
        {assets && assets.length > 0 ? (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 bg-[#F8F9FA] border border-black/5 rounded-[16px] hover:border-black/10 transition-all space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-black/5 flex-shrink-0 mt-0.5">
                      <FileText size={18} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {asset.asset_category && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider rounded-md border border-indigo-100">
                            {asset.asset_category}
                          </span>
                        )}
                        {asset.created_at && (
                          <span className="text-[10px] font-medium text-gray-400">
                            {new Date(asset.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#111827] truncate" title={asset.file_name}>
                        {asset.file_name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={asset.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-white border border-black/10 px-3 py-1.5 rounded-lg text-xs font-bold text-[#111827] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <Download size={14} /> Unduh
                    </a>
                    <form action={async () => {
                      'use server'
                      await deleteProjectAsset(asset.id, asset.file_url, project.id)
                    }}>
                      <button type="submit" className="flex items-center justify-center bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-1.5 rounded-lg transition-all shadow-sm" title="Hapus Aset">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Catatan Keterangan dari Klien */}
                {asset.asset_notes && (
                  <div className="p-3 bg-white rounded-xl border border-black/5 text-xs text-[#4B5563] flex items-start gap-2">
                    <span className="text-amber-500 font-bold flex-shrink-0">📝 Catatan:</span>
                    <span className="font-medium text-gray-800 whitespace-pre-wrap">{asset.asset_notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#4B5563] italic bg-[#F8F9FA] p-4 rounded-[12px] text-center border border-black/5">
            Klien belum mengupload aset apapun.
          </p>
        )}
      </div>
      )}
    </div>
  )
}
