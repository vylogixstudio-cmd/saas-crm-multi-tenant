import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { Users, UserCircle2, ShieldAlert, CheckCircle2, TrendingUp, Activity } from 'lucide-react'
import type { Metadata } from 'next'
import AddStaffModal from './AddStaffModal'

export const metadata: Metadata = {
  title: 'Manajemen Tim | Vylogix CRM',
  description: 'Kelola staf agensi dan pantau aktivitas mereka.',
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">Admin</span>
    case 'staff_ops':
      return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">PM/Ops</span>
    case 'staff_executor':
      return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase tracking-wider">Eksekutor</span>
    case 'staff_digital':
      return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase tracking-wider">Tim Digital</span>
    case 'staff_finance':
      return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">Keuangan</span>
    case 'staff_cs':
      return <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-extrabold uppercase tracking-wider">CS/Sales</span>
    case 'staff_design':
      return <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">Desain</span>
    case 'staff_warehouse':
      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider">Gudang</span>
    case 'staff_production':
      return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wider">Produksi</span>
    case 'staff_shipping':
      return <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-extrabold uppercase tracking-wider">Logistik</span>
    default:
      return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-extrabold uppercase tracking-wider">{role}</span>
  }
}

export default async function TeamPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Pastikan user adalah admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, role, organizations(module_physical, industry_type)')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id || profile.role !== 'admin') {
    redirect('/dashboard') // Hanya admin yang boleh masuk sini
  }

  // @ts-ignore
  const isPhysical = profile.organizations?.module_physical === true || profile.organizations?.industry_type === 'PHYSICAL' || profile.organizations?.industry_type === 'MANUFACTURING'
  // @ts-ignore
  const isHybrid = isPhysical && profile.organizations?.module_digital !== false

  // Fetch all staff members in the same organization
  const { data: staffList } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, whatsapp_number, created_at')
    .eq('organization_id', profile.organization_id)
    .neq('role', 'client')
    .order('created_at', { ascending: true })

  // Fetch audit logs for leaderboard (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: logs } = await supabaseAdmin
    .from('audit_logs')
    .select('actor_email, action')
    .eq('organization_id', profile.organization_id)
    .gte('created_at', sevenDaysAgo.toISOString())

  // Calculate Leaderboard
  const activityCount: Record<string, number> = {}
  logs?.forEach(log => {
    if (log.actor_email) {
      activityCount[log.actor_email] = (activityCount[log.actor_email] || 0) + 1
    }
  })

  const leaderboard = Object.entries(activityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3 most active

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-black/5">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-50 rounded-[16px] text-purple-600">
              <Users size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">Manajemen Tim</h1>
              <p className="text-[#6B7280] text-sm mt-1">Kelola staf dan hak akses (RBAC) agensi Anda.</p>
            </div>
          </div>
          <div>
            <AddStaffModal isPhysical={isPhysical} isHybrid={isHybrid} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (Staff List) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[24px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-extrabold text-[#111827] text-lg">Daftar Staf ({staffList?.length || 0})</h3>
              </div>
              <div className="divide-y divide-black/5 flex-1">
                {staffList?.map((staff) => (
                  <div key={staff.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm shadow-inner">
                        {staff.full_name?.substring(0, 1).toUpperCase() || <UserCircle2 size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[#111827] text-sm">{staff.full_name}</p>
                          {getRoleBadge(staff.role)}
                        </div>
                        <p className="text-xs text-[#6B7280]">{staff.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider mb-1">Bergabung</p>
                      <p className="text-xs font-semibold text-[#4B5563]">
                        {new Date(staff.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Leaderboard) */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] p-6 rounded-[24px] shadow-sm border border-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={100} /></div>
              <h3 className="font-extrabold text-white text-lg mb-1 relative z-10 flex items-center gap-2">
                <Activity size={20} className="text-emerald-400" /> Leaderboard Staf
              </h3>
              <p className="text-[11px] text-white/50 mb-6 relative z-10">Berdasarkan total aktivitas dalam 7 hari terakhir.</p>
              
              <div className="space-y-4 relative z-10">
                {leaderboard.length > 0 ? leaderboard.map(([email, count], idx) => {
                  const staffName = staffList?.find(s => s.email === email)?.full_name || email
                  return (
                    <div key={email} className="flex items-center justify-between p-3 bg-white/5 rounded-[12px] border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-extrabold ${idx === 0 ? 'bg-amber-400 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : idx === 1 ? 'bg-gray-300 text-gray-800' : 'bg-orange-300 text-orange-900'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[100px]">{staffName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-white/70">{count} Aksi</p>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-white/50">Belum ada aktivitas terekam.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100">
              <div className="flex gap-3 items-start">
                <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900 mb-1">Panduan Role Akses</h4>
                  <ul className="text-[10px] text-blue-800 space-y-2 list-disc pl-3">
                    <li><strong className="font-bold">Operasional:</strong> Akses penuh ke Klien & Proyek. Tidak bisa akses keuangan.</li>
                    <li><strong className="font-bold">Eksekutor:</strong> Hanya bisa melihat proyek dan upload aset/revisi.</li>
                    <li><strong className="font-bold">Keuangan:</strong> Akses penuh ke Invoice, Kasir, dan Buku Besar Kas.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
