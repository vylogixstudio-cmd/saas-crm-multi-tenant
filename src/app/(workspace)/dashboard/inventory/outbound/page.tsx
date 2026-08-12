import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import OutboundClient from './OutboundClient'

export default async function OutboundPage() {
  const supabaseAuth = await createClient()
  const supabase = createAdminClient()

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) return <div>No Organization Found</div>

  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, unit')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  const { data: transactions } = await supabase
    .from('inventory_transactions')
    .select('*, inventory_items(name, unit)')
    .eq('organization_id', orgId)
    .eq('type', 'OUT')
    .order('created_at', { ascending: false })
    .limit(30)

  return <OutboundClient items={items || []} history={transactions || []} />
}
