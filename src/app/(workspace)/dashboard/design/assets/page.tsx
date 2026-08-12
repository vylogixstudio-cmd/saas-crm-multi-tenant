import { createClient } from '@/utils/supabase/server'
import AssetsClient from './AssetsClient'

export default async function DesignAssetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) return <div>No Organization Found</div>

  const { data: assets } = await supabase
    .from('design_assets')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return <AssetsClient assets={assets || []} />
}
