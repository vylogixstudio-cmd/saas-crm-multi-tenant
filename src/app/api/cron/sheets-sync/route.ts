import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { clearAndWrite } from '@/lib/googleSheets';

// This endpoint should be protected if not using Vercel Cron.
// Vercel Cron sends a specific header `Authorization: Bearer <CRON_SECRET>`.

export async function GET(request: Request) {
  // Simple check (adjust based on your Cron provider)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized cron access' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Fetch all configurations that are set to 'scheduled'
  const { data: configs, error } = await supabase
    .from('agency_sheet_configs')
    .select('*')
    .eq('sync_mode', 'scheduled');

  if (error || !configs || configs.length === 0) {
    return NextResponse.json({ message: 'No scheduled syncs to run.' });
  }

  let processed = 0;

  for (const config of configs) {
    const lastSynced = config.last_synced_at ? new Date(config.last_synced_at) : new Date(0);
    const intervalHours = config.sync_interval_hours || 24;
    const nextSyncTime = new Date(lastSynced.getTime() + intervalHours * 60 * 60 * 1000);

    // If it's time to sync
    if (new Date() >= nextSyncTime) {
      const agency_id = config.agency_id;

      // 2. Fetch agency module settings
      const { data: org } = await supabase
        .from('organizations')
        .select('module_digital, module_physical')
        .eq('id', agency_id)
        .single();

      if (!org) continue;

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

        // === EXPORT FINANCE ===
        let financeRows: any[][] = [['Invoice Number', 'Title', 'Client', 'Project', 'Amount', 'Status', 'Due Date', 'Termin', 'Created At']];
        const { data: invoices } = await supabase
          .from('fin_invoices')
          .select('invoice_number, title, amount, status, due_date, termin_label, created_at, profiles(full_name), projects(title)')
          .eq('organization_id', agency_id)
          .order('created_at', { ascending: false });

        if (invoices) {
          invoices.forEach(inv => {
            financeRows.push([
              inv.invoice_number, inv.title, (inv.profiles as any)?.full_name || '-', (inv.projects as any)?.title || '-',
              inv.amount, inv.status, inv.due_date, inv.termin_label, inv.created_at
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

        // Write to configured tabs
        if (config.tab_projects) await clearAndWrite(config.sheet_id, config.tab_projects, projectRows);
        if (config.tab_finance) await clearAndWrite(config.sheet_id, config.tab_finance, financeRows);
        if (config.tab_operations) await clearAndWrite(config.sheet_id, config.tab_operations, opsRows);
        if (isPhysical && inventoryRows.length > 0) await clearAndWrite(config.sheet_id, 'Master Stok Gudang', inventoryRows);
        
        // Update last_synced_at
        await supabase.from('agency_sheet_configs').update({ last_synced_at: new Date().toISOString() }).eq('id', config.id);
        processed++;
      } catch (err) {
        console.error(`Scheduled Sync Error for config ${config.id}:`, err);
      }
    }
  }

  return NextResponse.json({ success: true, processed });
}
