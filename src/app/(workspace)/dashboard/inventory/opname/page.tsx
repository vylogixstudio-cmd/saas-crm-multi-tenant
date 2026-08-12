import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import OpnameClient from './OpnameClient'

export default async function OpnamePage() {
  const supabaseAuth = await createClient()
  const supabase = createAdminClient()

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) redirect('/login')

  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, unit')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  const { data: transactions } = await supabase
    .from('inventory_transactions')
    .select('*, inventory_items(name, unit)')
    .eq('organization_id', orgId)
    .eq('type', 'ADJUST')
    .order('created_at', { ascending: false })
    .limit(30)

  return <OpnameClient items={items || []} history={transactions || []} />
}
