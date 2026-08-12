import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Mail, Calendar, Briefcase, MapPin, Package } from 'lucide-react'
import ClientSettings from './ClientSettings'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()
  let currentOrgId: string | null = null

  // Get org id and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
    
  if (profile?.organization_id) {
    currentOrgId = profile.organization_id
  }

  if (!currentOrgId) redirect('/dashboard')

  const userRole = profile?.role || 'staff_digital'
  const isExecutor = ['staff_executor', 'staff_digital'].includes(userRole)

  // Fetch client details
  const { data: client, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('organization_id', currentOrgId)
    .single()

  if (error || !client) {
    redirect('/dashboard/clients')
  }

  // Fetch client projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', id)
    .eq('organization_id', currentOrgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#4B5563] hover:text-[#111827] mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Daftar Klien
        </Link>

        {/* Client Profile Card */}
        <div className="bg-white rounded-[20px] shadow-sm border border-black/5 p-6 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-start">
          <div className="w-20 h-20 bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center justify-center shrink-0">
            <User size={40} />
          </div>
          <div className="flex-1">
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] mb-1">
              {client.full_name || 'Klien Tanpa Nama'}
            </h1>
            <p className="text-sm text-[#6B7280] flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-[#F3F4F6] rounded-md text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">ID Klien</span>
              {client.id}
            </p>
            {(profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'staff_ops') && (
              <ClientSettings client={client} />
            )}
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[250px] bg-[#F8F9FA] p-4 rounded-[16px] border border-black/5">
            <div className="flex items-center gap-3 text-sm text-[#4B5563]">
              <Mail size={16} className="text-[#6B7280]" />
              <span className="font-medium">{client.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#4B5563]">
              <Phone size={16} className="text-[#6B7280]" />
              <span className="font-medium">{client.whatsapp_number || 'Belum ditambahkan'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#4B5563]">
              <Calendar size={16} className="text-[#6B7280]" />
              <span className="font-medium">Bergabung: {new Date(client.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            {client.role === 'supplier' && (
              <>
                {client.address && (
                  <div className="flex items-start gap-3 text-sm text-[#4B5563] mt-2 pt-3 border-t border-black/5">
                    <MapPin size={16} className="text-[#6B7280] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{client.address}</span>
                  </div>
                )}
                {client.supplier_goods && (
                  <div className="flex items-start gap-3 text-sm text-[#4B5563]">
                    <Package size={16} className="text-[#6B7280] shrink-0 mt-0.5" />
                    <span className="font-medium">Pemasok: <span className="font-bold text-[#111827]">{client.supplier_goods}</span></span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Client Projects (Hanya tampil jika bukan supplier) */}
        {client.role !== 'supplier' && (
          <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
            <div className="p-6 border-b border-black/5 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-[10px] text-[#2563EB]">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-[#111827]">Riwayat Proyek Klien</h2>
                <p className="text-xs text-[#4B5563] mt-0.5">Semua pesanan yang pernah dibuat oleh klien ini.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                    <th className="py-3 px-4 rounded-tl-[12px]">Judul Proyek</th>
                    <th className="py-3 px-4">Tipe Jasa</th>
                    {!isExecutor && <th className="py-3 px-4">Harga Total</th>}
                    <th className="py-3 px-4">Status Proyek</th>
                    <th className="py-3 px-4 text-right rounded-tr-[12px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {projects?.map((proj) => (
                    <tr key={proj.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#111827]">{proj.title}</div>
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase mt-1">
                          Dibuat: {new Date(proj.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {proj.service_type}
                        </span>
                      </td>
                      {!isExecutor && (
                        <td className="py-4 px-4 align-middle">
                          <div className="text-sm font-bold text-[#111827]">Rp {proj.total_price.toLocaleString('id-ID')}</div>
                        </td>
                      )}
                      <td className="py-4 px-4 align-middle">
                        <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${proj.status === 'completed' || proj.status === 'selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right align-middle">
                        <Link href={`/dashboard/clients/${id}/project/${proj.id}`} className="inline-block whitespace-nowrap bg-white border border-black/10 hover:bg-[#111827] hover:text-white text-[#111827] font-bold px-4 py-2 rounded-[8px] text-xs transition-all shadow-sm">
                          Buka Proyek
                        </Link>
                      </td>
                    </tr>
                  ))}
                  
                  {(!projects || projects.length === 0) && (
                    <tr>
                      <td colSpan={isExecutor ? 4 : 5} className="py-12 text-center text-[#4B5563] font-medium text-sm">
                        Klien ini belum pernah membuat proyek.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
