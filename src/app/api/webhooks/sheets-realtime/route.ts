import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { clearAndWrite } from '@/lib/googleSheets';

export async function POST(request: Request) {
  // Simple auth check via Bearer token (you should set this in Supabase Webhook headers)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer YOUR_SECRET_TOKEN') {
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  const body = await request.json();
  const agency_id = body.agency_id;

  if (!agency_id) {
    return NextResponse.json({ error: 'Missing agency_id' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Check if agency has realtime sync enabled
  const { data: configs } = await supabase
    .from('agency_sheet_configs')
    .select('*')
    .eq('agency_id', agency_id)
    .eq('sync_mode', 'realtime');

  if (!configs || configs.length === 0) {
    return NextResponse.json({ message: 'No realtime config found for this agency' });
  }

  // 2. Fetch agency module settings
  const { data: org } = await supabase
    .from('organizations')
    .select('module_digital, module_physical')
    .eq('id', agency_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 });
  }

  try {
    // === EXPORT PROJECTS ===
    let projectRows: any[][] = [['Project ID', 'Title', 'Client', 'Category', 'Status', 'Progress %', 'Deadline', 'Total Price', 'Payment Status']];
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, status, progress_percentage, deadline, total_price, payment_status, project_category, profiles(full_name)')
      .eq('organization_id', agency_id)
      .order('created_at', { ascending: false });

    if (projects) {
      projects.forEach(p => {
        projectRows.push([
          p.id, p.title, (p.profiles as any)?.full_name || '-', p.project_category, p.status, p.progress_percentage, 
          p.deadline, p.total_price, p.payment_status
        ]);
      });
    }

    // === EXPORT OPERATIONS ===
    const isDigital = org.module_digital;
    const isPhysical = org.module_physical;
    let opsHeaders = ['Project ID', 'Project Title', 'Category'];
    if (isDigital) opsHeaders.push('Domain', 'Expiry', 'Platform', 'Design Notes');
    if (isPhysical) opsHeaders.push('Item Type', 'Qty', 'Shipping Courier', 'Tracking Number', 'Shipping Status');
    let opsRows: any[][] = [opsHeaders];

    const { data: opsProjects } = await supabase
      .from('projects')
      .select('id, title, project_category, project_digital_details(domain_name, domain_expiry_date, platform, design_notes), project_physical_details(item_type, quantity, shipping_courier, tracking_number, shipping_status)')
      .eq('organization_id', agency_id)
      .order('created_at', { ascending: false });

    if (opsProjects) {
      opsProjects.forEach(p => {
        let row = [p.id, p.title, p.project_category];
        if (isDigital) {
          row.push(
            (p.project_digital_details as any)?.domain_name || '-',
            (p.project_digital_details as any)?.domain_expiry_date || '-',
            (p.project_digital_details as any)?.platform || '-',
            (p.project_digital_details as any)?.design_notes || '-'
          );
        }
        if (isPhysical) {
          row.push(
            (p.project_physical_details as any)?.item_type || '-',
            (p.project_physical_details as any)?.quantity || '-',
            (p.project_physical_details as any)?.shipping_courier || '-',
            (p.project_physical_details as any)?.tracking_number || '-',
            (p.project_physical_details as any)?.shipping_status || '-'
          );
        }
        opsRows.push(row);
      });
    }

    // === EXPORT INVENTORY (IF PHYSICAL) ===
    let inventoryRows: any[][] = [];
    if (isPhysical) {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', agency_id)
        .order('name', { ascending: true });

      inventoryRows.push([
        'ID Bahan', 'Nama Material / Bahan', 'Kategori', 'Stok Saat Ini', 
        'Satuan', 'Batas Min. Stok (Alert)', 'Status Ketersediaan', 'Terakhir Diupdate'
      ]);

      if (items) {
        items.forEach(item => {
          const curStock = Number(item.current_stock || 0);
          const minAlert = Number(item.min_stock_alert || 0);
          let status = 'AMAN';
          if (curStock <= 0) status = 'HABIS';
          else if (curStock <= minAlert) status = 'HAMPIR HABIS';

          inventoryRows.push([
            item.id,
            item.name,
            item.category || 'Umum',
            curStock,
            item.unit || 'Pcs',
            minAlert,
            status,
            new Date(item.updated_at || item.created_at).toLocaleString('id-ID')
          ]);
        });
      }
    }

    // Write to each configured sheet
    for (const config of configs) {
      // Sync Projects tab
      if (config.tab_projects) await clearAndWrite(config.sheet_id, config.tab_projects, projectRows);
      // Sync Operations tab
      if (config.tab_operations) await clearAndWrite(config.sheet_id, config.tab_operations, opsRows);
      if (isPhysical && inventoryRows.length > 0) await clearAndWrite(config.sheet_id, 'Master Stok Gudang', inventoryRows);
      
      // Update last_synced_at
      await supabase.from('agency_sheet_configs').update({ last_synced_at: new Date().toISOString() }).eq('id', config.id);
    }

    return NextResponse.json({ success: true, message: 'Realtime sync completed.' });
  } catch (error: any) {
    console.error('Realtime Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
