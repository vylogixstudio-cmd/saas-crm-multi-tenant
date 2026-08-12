import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getAuthenticatedUser } from '@/app/(workspace)/dashboard/actions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const { user, orgId, error: authError } = await getAuthenticatedUser()
  if (authError || !user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  const { data: invoice, error: getError } = await supabase
    .from('fin_invoices')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (getError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('fin_invoices')
    .update({ status: 'PAID' })
    .eq('id', id)
    
  if (updateError) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
