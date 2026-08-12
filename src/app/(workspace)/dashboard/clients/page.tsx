import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import CreateClientModal from '@/components/CreateClientModal'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ClientsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const currentTab = (searchParams?.tab as string) === 'supplier' ? 'supplier' : 'client'

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()
  let currentOrgId: string | null = null

  // Get org id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  let isPhysical = false

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, is_active, auto_suspend, license_expires_at, module_digital, module_physical, industry_type')
      .eq('id', profile.organization_id)
      .single()

    const isExpired = org?.license_expires_at ? new Date() > new Date(org.license_expires_at) : false
    if (!org || org.is_active === false || (org.auto_suspend && isExpired)) {
      redirect('/suspended')
    }
    currentOrgId = org.id
    const isIndustryPhysical = org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING'
    isPhysical = org?.module_physical === true || isIndustryPhysical
  }

  // Jika digital agency dan tab supplier diakses, fallback ke client
  const activeTab = !isPhysical ? 'client' : currentTab

  // Fetch users based on role
  let clientsQuery = supabase
    .from('profiles')
    .select('id, full_name, email, created_at, whatsapp_number, address, supplier_goods')
    .eq('role', activeTab)
    .order('created_at', { ascending: false })

  if (currentOrgId) {
    clientsQuery = clientsQuery.eq('organization_id', currentOrgId)
  }

  const { data: clients } = await clientsQuery

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-extrabold text-2xl text-[#111827] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Users size={28} className="text-[#2563EB]" /> {isPhysical ? 'Manajemen Klien & Pemasok' : 'Manajemen Klien'}
            </h1>
            <p className="text-[#4B5563] text-sm mt-1">
              {isPhysical 
                ? 'Kelola data klien dan pemasok (supplier) yang terdaftar di agensi Anda.'
                : 'Kelola data klien yang terdaftar di agensi Anda.'
              }
            </p>
          </div>
          {['super_admin', 'admin', 'staff_ops'].includes(profile?.role) && (
            <CreateClientModal defaultRole={activeTab} />
          )}
        </div>

        {/* Tabs Navigation (Hanya muncul jika agensi fisik/manufaktur) */}
        {isPhysical && (
          <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
            <Link 
              href="/dashboard/clients?tab=client"
              className={`pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'client' 
                ? 'border-[#2563EB] text-[#2563EB]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Klien
            </Link>
            <Link 
              href="/dashboard/clients?tab=supplier"
              className={`pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'supplier' 
                ? 'border-[#2563EB] text-[#2563EB]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pemasok (Supplier)
            </Link>
          </div>
        )}

        <div className="bg-white rounded-[20px] border border-black/5 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-[#4B5563] bg-[#F8F9FA]/50">
                  <th className="py-3 px-4 rounded-tl-[12px]">Nama {currentTab === 'supplier' ? 'Pemasok' : 'Klien'}</th>
                  <th className="py-3 px-4">Kontak (Email / Telepon)</th>
                  {currentTab === 'supplier' ? (
                    <>
                      <th className="py-3 px-4">Alamat</th>
                      <th className="py-3 px-4 rounded-tr-[12px]">Pemasok Untuk</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Tanggal Terdaftar</th>
                      <th className="py-3 px-4 text-right rounded-tr-[12px]">Aksi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {clients?.map((client) => (
                  <tr key={client.id} className="border-b border-black/5 last:border-0 hover:bg-[#F8F9FA] transition-colors relative group">
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-[#111827]">{client.full_name || 'Tanpa Nama'}</div>
                      <div className="text-xs font-medium text-[#4B5563] mt-1">ID: {client.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-[#111827]">{client.email}</div>
                      <div className="text-xs font-medium text-[#4B5563] mt-1">{client.whatsapp_number || '-'}</div>
                    </td>
                    {currentTab === 'supplier' ? (
                      <>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-[#4B5563] max-w-[200px] whitespace-normal" title={client.address || ''}>
                            {client.address || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-bold text-[#111827] bg-[#F3F4F6] px-3 py-1 rounded-md inline-block">
                            {client.supplier_goods || '-'}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-4">
                          <span className="text-xs font-medium text-[#4B5563]">
                            {new Date(client.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/dashboard/clients/${client.id}`} className="inline-block bg-white border border-black/10 hover:bg-[#F8F9FA] text-[#111827] font-bold px-4 py-2 rounded-[8px] text-xs transition-all shadow-sm whitespace-nowrap">
                            Lihat Detail
                          </Link>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {(!clients || clients.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#4B5563] font-medium text-sm">
                      Belum ada {currentTab === 'supplier' ? 'pemasok' : 'klien'} yang terdaftar. Tambahkan {currentTab === 'supplier' ? 'pemasok' : 'klien'} baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
