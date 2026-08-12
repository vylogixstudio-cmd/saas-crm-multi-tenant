import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { 
  FolderPlus, Edit, Trash2, UserPlus, FileText, 
  Settings, CheckCircle, MessageSquare, AlertCircle, 
  FilePlus, Activity, CreditCard
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Log Aktivitas | Vylogix CRM',
  description: 'Riwayat semua aktivitas yang terjadi di organisasi Anda.',
}

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string
  actor_email: string | null
  action: string
  target_type: string | null
  target_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateLogDetails(log: AuditLogEntry) {
  const actor = log.actor_email ? log.actor_email.split('@')[0] : 'Sistem'
  const email = log.actor_email ?? 'sistem'
  const target = log.target_name ?? 'sesuatu'
  const time = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  let icon = <Activity size={18} />
  let color = 'bg-gray-100 text-gray-500 border-gray-200'
  let description = <><strong className="text-[#111827]">{actor}</strong> melakukan aktivitas pada <strong>{target}</strong>.</>

  switch (log.action) {
    // Proyek
    case 'project.create':
      icon = <FolderPlus size={18} />
      color = 'bg-emerald-100 text-emerald-600 border-emerald-200'
      description = <><strong className="text-[#111827]">{actor}</strong> membuat proyek baru bernama <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'project.update':
      icon = <Edit size={18} />
      color = 'bg-blue-100 text-blue-600 border-blue-200'
      description = <><strong className="text-[#111827]">{actor}</strong> memperbarui data proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'project.update_status':
      icon = <CheckCircle size={18} />
      color = 'bg-purple-100 text-purple-600 border-purple-200'
      description = <><strong className="text-[#111827]">{actor}</strong> mengubah status proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'project.delete':
      icon = <Trash2 size={18} />
      color = 'bg-rose-100 text-rose-600 border-rose-200'
      description = <><strong className="text-[#111827]">{actor}</strong> menghapus proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
      
    // Klien
    case 'client.create':
      icon = <UserPlus size={18} />
      color = 'bg-emerald-100 text-emerald-600 border-emerald-200'
      description = <><strong className="text-[#111827]">{actor}</strong> mendaftarkan klien baru bernama <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'client.update':
      icon = <Edit size={18} />
      color = 'bg-blue-100 text-blue-600 border-blue-200'
      description = <><strong className="text-[#111827]">{actor}</strong> memperbarui data klien <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'client.delete':
      icon = <Trash2 size={18} />
      color = 'bg-rose-100 text-rose-600 border-rose-200'
      description = <><strong className="text-[#111827]">{actor}</strong> menghapus klien <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break

    // Revisi
    case 'revision.create':
      icon = <AlertCircle size={18} />
      color = 'bg-amber-100 text-amber-600 border-amber-200'
      description = <><strong className="text-[#111827]">{actor}</strong> (Klien) meminta revisi baru untuk proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'revision.reply':
      icon = <MessageSquare size={18} />
      color = 'bg-blue-100 text-blue-600 border-blue-200'
      description = <><strong className="text-[#111827]">{actor}</strong> membalas catatan revisi pada proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break

    // Aset
    case 'asset.upload':
      icon = <FilePlus size={18} />
      color = 'bg-indigo-100 text-indigo-600 border-indigo-200'
      description = <><strong className="text-[#111827]">{actor}</strong> mengunggah aset baru untuk proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'asset.delete':
      icon = <Trash2 size={18} />
      color = 'bg-rose-100 text-rose-600 border-rose-200'
      description = <><strong className="text-[#111827]">{actor}</strong> menghapus aset dari proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break

    // Finance (Asumsi aksi dari POS)
    case 'invoice.create':
      icon = <FileText size={18} />
      color = 'bg-emerald-100 text-emerald-600 border-emerald-200'
      description = <><strong className="text-[#111827]">{actor}</strong> (Staf POS) membuat invoice untuk proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'invoice.pay':
      icon = <CreditCard size={18} />
      color = 'bg-blue-100 text-blue-600 border-blue-200'
      description = <><strong className="text-[#111827]">{actor}</strong> (Staf POS) mengonfirmasi pembayaran lunas untuk invoice pada proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break
    case 'invoice.cancel':
      icon = <AlertCircle size={18} />
      color = 'bg-rose-100 text-rose-600 border-rose-200'
      description = <><strong className="text-[#111827]">{actor}</strong> (Staf POS) membatalkan invoice untuk proyek <strong className="text-[#111827]">&quot;{target}&quot;</strong>.</>
      break

    // Organisasi / Lainnya
    case 'settings.update':
      icon = <Settings size={18} />
      color = 'bg-gray-100 text-gray-700 border-gray-200'
      description = <><strong className="text-[#111827]">{actor}</strong> memperbarui pengaturan organisasi.</>
      break
  }

  // Format the raw action just in case we need it as a tooltip or tag
  const actionParts = log.action.split('.')
  const rawTag = actionParts.length > 1 ? actionParts.slice(1).join(' ').replace(/_/g, ' ') : log.action

  return { icon, color, description, time, email, rawTag }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id || profile.role === 'client') {
    redirect('/dashboard')
  }

  const { data: logs, error: logsError } = await supabaseAdmin
    .from('audit_logs')
    .select('id, actor_email, action, target_type, target_name, metadata, created_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (logsError) {
    console.error('Failed to fetch audit logs:', logsError)
  }

  const auditLogs: AuditLogEntry[] = (logs ?? []) as AuditLogEntry[]

  // Group logs by date
  const groupedLogs: Record<string, AuditLogEntry[]> = {}
  auditLogs.forEach(log => {
    const dateStr = new Date(log.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    if (!groupedLogs[dateStr]) groupedLogs[dateStr] = []
    groupedLogs[dateStr].push(log)
  })

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 bg-white p-6 rounded-[20px] shadow-sm border border-black/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EFF6FF] rounded-[16px] text-[#2563EB]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">
                Log Aktivitas
              </h1>
              <p className="text-[#4B5563] text-sm mt-0.5">
                Riwayat aktivitas yang terjadi di organisasi Anda.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] px-5 py-2.5 border border-black/10 rounded-[12px] hover:bg-black/5 transition-all shadow-sm bg-white self-start sm:self-auto"
          >
            ← Kembali ke Dasbor
          </Link>
        </div>

        {/* Timeline Log */}
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 sm:p-8">
          {auditLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F8F9FA] border border-black/5 mb-4">
                <Activity className="w-7 h-7 text-[#9CA3AF]" />
              </div>
              <p className="font-bold text-[#111827] mb-1">Belum Ada Aktivitas</p>
              <p className="text-sm text-[#6B7280]">
                Log akan muncul di sini setelah ada interaksi di dalam sistem.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedLogs).map(([date, logsInDate]) => (
                <div key={date}>
                  {/* Date Header */}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-4 pb-2 border-b border-black/5 flex items-center gap-2">
                    {date}
                  </h3>
                  
                  {/* Timeline Items */}
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/10 before:to-transparent">
                    {logsInDate.map((log) => {
                      const { icon, color, description, time, email, rawTag } = generateLogDetails(log)
                      return (
                        <div key={log.id} className="relative flex items-center gap-4 sm:gap-6 group">
                          {/* Timeline Line Connector (Visual Only) */}
                          <div className="hidden sm:block absolute left-[1.4rem] top-1/2 -translate-y-1/2 w-8 h-[2px] bg-black/5 -z-10"></div>
                          
                          {/* Icon Circle */}
                          <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full shadow-sm bg-white border-[2px] ${color} z-10 relative transition-transform group-hover:scale-105`}>
                            {icon}
                          </div>
                          
                          {/* Content Bubble */}
                          <div className="flex-1 bg-white border border-black/5 rounded-[16px] p-4 shadow-sm hover:shadow-md transition-shadow group-hover:border-black/10">
                            <p className="text-sm text-[#4B5563] leading-relaxed">
                              {description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5">
                              <span className="text-[11px] font-bold text-[#9CA3AF] bg-[#F8F9FA] px-2 py-0.5 rounded-full">{time} WIB</span>
                              <span className="w-1 h-1 rounded-full bg-black/10"></span>
                              <span className="text-[11px] font-medium text-[#9CA3AF] truncate max-w-[120px] sm:max-w-none" title={email}>{email}</span>
                              <span className="w-1 h-1 rounded-full bg-black/10"></span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-1.5 py-0.5 rounded border border-black/5 bg-white">
                                {rawTag}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-[#9CA3AF] mt-6 mb-8">
          Menampilkan maksimal 100 entri terbaru. Log disimpan secara permanen.
        </p>
      </div>
    </div>
  )
}
