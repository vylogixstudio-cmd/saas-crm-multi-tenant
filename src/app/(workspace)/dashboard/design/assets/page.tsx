import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import AssetsClient from './AssetsClient'

export default async function DesignAssetsPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) return <div>No Organization Found</div>

  const { data: assets } = await supabase
    .from('design_assets')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return <AssetsClient assets={assets || []} />
}
