import { NextResponse } from 'next/server';
import { getTenantContext } from '@/utils/tenant';
import { validateSheetAccess } from '@/lib/googleSheets';

export async function GET() {
  const { user, orgId, supabaseAdmin } = await getTenantContext();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Fetch configs using admin client to prevent RLS false-positive
  const { data: configs, error } = await supabaseAdmin
    .from('agency_sheet_configs')
    .select('*')
    .eq('agency_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(configs || []);
}

export async function POST(request: Request) {
  const { user, orgId, role, isSuperAdmin, supabaseAdmin } = await getTenantContext();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Hanya admin agensi atau super admin yang boleh mengatur sheet
  const allowedRoles = ['admin', 'super_admin', 'superadmin'];
  if (!isSuperAdmin && (!role || !allowedRoles.includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  // Upsert the config using supabaseAdmin (bypasses RLS safely on the server)
  const { data, error } = await supabaseAdmin
    .from('agency_sheet_configs')
    .upsert({
      agency_id: orgId,
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
