import { getTenantContext } from '@/utils/tenant'
import { redirect } from 'next/navigation'
import OutboundClient from './OutboundClient'

export default async function OutboundPage() {
  const { user, orgId, isSuspended, supabaseAdmin: supabase } = await getTenantContext()

  if (!user) redirect('/login')
  if (isSuspended) redirect('/suspended')
  if (!orgId) redirect('/dashboard')

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
