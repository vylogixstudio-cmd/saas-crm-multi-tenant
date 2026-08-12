import { createClient } from '@/utils/supabase/server'
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Globe, Server, AlertTriangle } from 'lucide-react'
import DomainActionButtons from './components/DomainActionButtons'

export const metadata = {
  title: 'Domain & Server - CRM Panel',
}

export default async function InfrastructurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const orgFilter = profile?.organization_id

  // Fetch projects that are DIGITAL or HYBRID, or have a domain name registered
  const { data: rawProjects } = await supabaseAdmin
    .from('projects')
    .select('id, title, domain_name, domain_expiry_date, hosting_info, status, service_class, project_category, profiles:client_id(full_name, whatsapp_number), project_digital_details(*)')
    .eq('organization_id', orgFilter)
    .or('project_category.eq.DIGITAL,project_category.eq.HYBRID,domain_name.not.is.null')
    .order('created_at', { ascending: false })

  // Map and merge data from project_digital_details
  const projects = (rawProjects || []).map((p: any) => {
    const dd = Array.isArray(p.project_digital_details) ? p.project_digital_details[0] : p.project_digital_details
    return {
      ...p,
      domain_name: dd?.domain_name || p.domain_name,
      domain_expiry_date: dd?.domain_expiry_date || p.domain_expiry_date,
      hosting_info: dd?.hosting_info || p.hosting_info,
      warranty_months: dd?.warranty_months,
      warranty_expired_at: dd?.warranty_expired_at,
    }
  })

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const exp = new Date(expiryDate)
    const diffTime = exp.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-4 sm:p-8 h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans']">Manajemen Domain & Server</h1>
          <p className="text-sm text-[#4B5563] mt-1">Lacak masa aktif domain dan hosting klien agar mudah ditagih perpanjangannya.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-gray-600">Aman</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs font-bold text-gray-600">&lt; 30 Hari</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="text-xs font-bold text-gray-600">Expired</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-black/5">
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider">Nama Domain</th>
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider">Klien & Proyek</th>
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider">Tanggal Expired</th>
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider">Hosting / Catatan</th>
                <th className="p-4 text-xs font-bold text-[#4B5563] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {projects && projects.length > 0 ? projects.map(proj => {
                const daysRemaining = proj.domain_expiry_date ? getDaysRemaining(proj.domain_expiry_date) : 999;
                let statusColor = 'bg-emerald-500';
                let statusBg = 'bg-emerald-50';
                let statusText = 'text-emerald-700';
                let statusLabel = 'Aman';

                if (!proj.domain_name) {
                  statusColor = 'bg-gray-400';
                  statusBg = 'bg-gray-100';
                  statusText = 'text-gray-600';
                  statusLabel = 'Belum Diset';
                } else if (daysRemaining <= 0) {
                  statusColor = 'bg-rose-500';
                  statusBg = 'bg-rose-50';
                  statusText = 'text-rose-700';
                  statusLabel = 'Expired!';
                } else if (daysRemaining <= 30) {
                  statusColor = 'bg-amber-500';
                  statusBg = 'bg-amber-50';
                  statusText = 'text-amber-700';
                  statusLabel = 'Segera Expired';
                }

                return (
                  <tr key={proj.id} className="border-b border-black/5 hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${statusBg} ${statusText} text-[10px] font-bold uppercase tracking-wider`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ${(daysRemaining <= 0 && proj.domain_name) ? 'animate-pulse' : ''}`}></div>
                        {statusLabel}
                      </div>
                    </td>
                    <td className="p-4">
                      {proj.domain_name ? (
                        <a 
                          href={`https://${proj.domain_name}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                        >
                          <Globe size={16} />
                          {proj.domain_name}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-sm flex items-center gap-1.5">
                          <Globe size={16} className="opacity-50" />
                          Belum ada domain
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{proj.title}</p>
                      <p className="text-xs text-gray-500">{(proj.profiles as any)?.full_name}</p>
                    </td>
                    <td className="p-4">
                      {proj.domain_expiry_date ? (
                        <div>
                          <p className={`text-sm font-bold ${daysRemaining <= 30 ? statusText : 'text-gray-900'}`}>
                            {new Date(proj.domain_expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {daysRemaining > 0 ? `Sisa ${daysRemaining} Hari` : `Lewat ${Math.abs(daysRemaining)} Hari`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-2">
                        <Server size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 truncate max-w-[200px] block" title={proj.hosting_info || ''}>
                          {proj.hosting_info || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <DomainActionButtons 
                        project={proj} 
                        whatsappNumber={(proj.profiles as any)?.whatsapp_number} 
                        clientName={(proj.profiles as any)?.full_name} 
                      />
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Globe size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Belum ada data domain yang didaftarkan pada proyek apapun.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
