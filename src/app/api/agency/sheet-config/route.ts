import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateSheetAccess } from '@/lib/googleSheets';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Fetch configs
  const { data: configs, error } = await supabase
    .from('agency_sheet_configs')
    .select('*')
    .eq('agency_id', profile.organization_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(configs || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user has permission
  const { data: hasPerm } = await supabase
    .rpc('has_permission', { p_user_id: user.id, p_permission: 'sheets.configure' });
    
  if (!hasPerm) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const body = await request.json();
  const { sheet_role, sheet_id, tab_projects, tab_finance, tab_operations, staff_edit_allowed, sync_mode, sync_interval_hours } = body;

  if (!sheet_role || !sheet_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate access via Google API
  const accessResult = await validateSheetAccess(sheet_id);
  if (!accessResult.success) {
    return NextResponse.json(
      { error: `Google API Error: ${accessResult.error}. Pastikan Sheet sudah di-share ke email Service Account.` },
      { status: 400 }
    );
  }

  // Upsert the config
  const { data, error } = await supabase
    .from('agency_sheet_configs')
    .upsert({
      agency_id: profile.organization_id,
      sheet_role,
      sheet_id,
      tab_projects: tab_projects || 'Projects',
      tab_finance: tab_finance || 'Finance',
      tab_operations: tab_operations || 'Operations',
      staff_edit_allowed: staff_edit_allowed || false,
      sync_mode: sync_mode || 'manual',
      sync_interval_hours: sync_interval_hours || 24,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'agency_id,sheet_role'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
