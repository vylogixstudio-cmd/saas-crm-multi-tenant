import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { clearAndWrite } from '@/lib/googleSheets';

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params; // 'projects', 'finance', 'operations', 'accounts', 'inventory', 'stock_mutations', 'shipping', 'maintenance', 'suppliers'
  
  const validTypes = [
    'projects', 'finance', 'operations', 'accounts',
    'inventory', 'stock_mutations', 'shipping', 'maintenance', 'suppliers'
  ];

  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user has export permission
  const { data: hasPerm } = await supabase
    .rpc('has_permission', { p_user_id: user.id, p_permission: 'sheets.export' });
    
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

  // Strict tenant isolation: orgId is locked to the authenticated user's organization
  const orgId = profile.organization_id;

  // Check agency type modules
  const { data: org } = await supabase
    .from('organizations')
    .select('module_digital, module_physical, industry_type')
    .eq('id', orgId)
    .single();

  // Fetch configs strictly for this agency
  const { data: configs, error: configError } = await supabase
    .from('agency_sheet_configs')
    .select('*')
    .eq('agency_id', orgId);

  if (configError || !configs || configs.length === 0) {
    return NextResponse.json({ error: 'No Google Sheets configured for this agency.' }, { status: 400 });
  }

  try {
    let rows: any[][] = [];
    
    // 1. PROJECTS EXPORT
    if (type === 'projects') {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, status, progress_percentage, deadline, total_price, payment_status, project_category, profiles(full_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      rows.push(['Project ID', 'Title', 'Client', 'Category', 'Status', 'Progress %', 'Deadline', 'Total Price', 'Payment Status']);
      if (projects) {
        projects.forEach(p => {
          rows.push([
            p.id, p.title, (p.profiles as any)?.full_name || '-', p.project_category, p.status, p.progress_percentage, 
            p.deadline, p.total_price, p.payment_status
          ]);
        });
      }
    } 
    // 2. FINANCE EXPORT
    else if (type === 'finance') {
      const { data: invoices } = await supabase
        .from('fin_invoices')
        .select('invoice_number, title, amount, status, due_date, termin_label, created_at, profiles(full_name), projects(title)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      rows.push(['Invoice Number', 'Title', 'Client', 'Project', 'Amount', 'Status', 'Due Date', 'Termin', 'Created At']);
      if (invoices) {
        invoices.forEach(inv => {
          rows.push([
            inv.invoice_number, inv.title, (inv.profiles as any)?.full_name || '-', (inv.projects as any)?.title || '-',
            inv.amount, inv.status, inv.due_date, inv.termin_label, inv.created_at
          ]);
        });
      }
    }
    // 3. OPERATIONS EXPORT
    else if (type === 'operations') {
      const isDigital = org?.module_digital;
      const isPhysical = org?.module_physical || org?.industry_type === 'PHYSICAL' || org?.industry_type === 'MANUFACTURING';
      
      let headers = ['Project ID', 'Project Title', 'Category'];
      if (isDigital) headers.push('Domain', 'Expiry', 'Platform', 'Design Notes');
      if (isPhysical) headers.push('Item Type', 'Qty', 'Shipping Courier', 'Tracking Number', 'Shipping Status');
      rows.push(headers);

      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, project_category, project_digital_details(domain_name, domain_expiry_date, platform, design_notes), project_physical_details(item_type, quantity, shipping_courier, tracking_number, shipping_status)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (projects) {
        projects.forEach(p => {
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
          rows.push(row);
        });
      }
    }
    // 4. ACCOUNTS (STAFF & CLIENTS) EXPORT
    else if (type === 'accounts') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, whatsapp_number, created_at')
        .eq('organization_id', orgId)
        .order('role', { ascending: true });

      const { data: projects } = await supabase
        .from('projects')
        .select('client_id, status, total_price')
        .eq('organization_id', orgId);

      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: logs } = await adminSupabase
        .from('audit_logs')
        .select('actor_id, action')
        .eq('organization_id', orgId);

      rows.push([
        'Account ID', 'Full Name', 'Email', 'Role', 'WhatsApp', 'Registered At', 
        'Client: Total Projects', 'Client: Completed', 'Client: Total Spent',
        'Staff: Total Activities', 'Staff: Major Actions (Completed)'
      ]);
      
      if (profiles) {
        profiles.forEach(p => {
          let totalProjects = 0;
          let completedProjects = 0;
          let totalSpent = 0;

          if (projects && p.role === 'client') {
            const clientProjects = projects.filter(proj => proj.client_id === p.id);
            totalProjects = clientProjects.length;
            completedProjects = clientProjects.filter(proj => proj.status === 'completed' || proj.status === 'delivered').length;
            totalSpent = clientProjects.reduce((sum, proj) => sum + Number(proj.total_price || 0), 0);
          }

          const isStaff = p.role !== 'client' && p.role !== 'admin' && p.role !== 'super_admin';
          let staffTotalActivities = 0;
          let staffMajorActions = 0;

          if (isStaff && logs) {
            const staffLogs = logs.filter(l => l.actor_id === p.id);
            staffTotalActivities = staffLogs.length;
            staffMajorActions = staffLogs.filter(l => l.action && l.action.toLowerCase().includes('complete')).length;
          }

          rows.push([
            p.id, p.full_name || '-', p.email || '-', p.role, p.whatsapp_number || '-', p.created_at,
            p.role === 'client' ? totalProjects : '-',
            p.role === 'client' ? completedProjects : '-',
            p.role === 'client' ? totalSpent : '-',
            isStaff ? staffTotalActivities : '-', 
            isStaff ? staffMajorActions : '-'
          ]);
        });
      }
    }
    // 5. INVENTORY (MASTER BAHAN BAKU) EXPORT
    else if (type === 'inventory') {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      rows.push([
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

          rows.push([
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
    // 6. STOCK MUTATIONS (KARTU STOK MUTASI IN/OUT) EXPORT
    else if (type === 'stock_mutations') {
      const { data: txs } = await supabase
        .from('inventory_transactions')
        .select('*, inventory_items(name, unit)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);

      rows.push(['Tanggal & Waktu', 'Nama Bahan Baku', 'Tipe Mutasi', 'Jumlah', 'Satuan', 'Catatan / No. Nota', 'PIC / Dicatat Oleh']);
      if (txs) {
        txs.forEach(t => {
          rows.push([
            new Date(t.created_at).toLocaleString('id-ID'),
            (t.inventory_items as any)?.name || '-',
            t.type === 'IN' ? 'MASUK (IN)' : t.type === 'OUT' ? 'KELUAR (OUT)' : 'PENYESUAIAN (ADJUST)',
            t.quantity,
            (t.inventory_items as any)?.unit || 'Pcs',
            t.notes || '-',
            t.actor_name || '-'
          ]);
        });
      }
    }
    // 7. SHIPPING & LOGISTICS EXPORT
    else if (type === 'shipping') {
      const { data: physicalProjects } = await supabase
        .from('projects')
        .select('id, title, deadline, status, profiles:client_id(full_name, whatsapp_number), project_physical_details(*)')
        .eq('organization_id', orgId)
        .eq('project_category', 'PHYSICAL')
        .order('created_at', { ascending: false });

      rows.push([
        'Project ID', 'Judul Pesanan', 'Nama Klien', 'No WhatsApp', 'Produk / Item', 'Qty',
        'Kurir / Ekspedisi', 'Nomor Resi', 'Status Pengiriman', 'Alamat Pengiriman', 'Deadline Produksi'
      ]);

      if (physicalProjects) {
        physicalProjects.forEach(p => {
          const pd = Array.isArray(p.project_physical_details) ? p.project_physical_details[0] : p.project_physical_details;
          rows.push([
            p.id,
            p.title,
            (p.profiles as any)?.full_name || '-',
            (p.profiles as any)?.whatsapp_number || '-',
            pd?.item_type || '-',
            pd?.quantity || 1,
            pd?.shipping_courier || '-',
            pd?.tracking_number || '-',
            pd?.shipping_status || 'WAITING',
            pd?.shipping_address || '-',
            pd?.production_deadline || p.deadline || '-'
          ]);
        });
      }
    }
    // 8. MAINTENANCE & MACHINE TICKETS EXPORT
    else if (type === 'maintenance') {
      const { data: tickets } = await supabase
        .from('maintenance_tickets')
        .select('*, profiles:reported_by(full_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      rows.push(['ID Laporan', 'Tanggal Lapor', 'Nama Mesin', 'Kendala / Kerusakan', 'Prioritas', 'Status', 'Dilaporkan Oleh']);
      if (tickets) {
        tickets.forEach(t => {
          rows.push([
            t.id,
            new Date(t.created_at).toLocaleString('id-ID'),
            t.machine_name,
            t.issue_description,
            t.priority?.toUpperCase() || 'MEDIUM',
            t.status === 'resolved' ? 'SELESAI' : t.status === 'in_progress' ? 'SEDANG SERVIS' : 'MENUNGGU (PENDING)',
            (t.profiles as any)?.full_name || '-'
          ]);
        });
      }
    }
    // 9. SUPPLIERS DIRECTORY EXPORT
    else if (type === 'suppliers') {
      const { data: suppliers } = await supabase
        .from('profiles')
        .select('id, full_name, email, whatsapp_number, address, supplier_goods, created_at')
        .eq('organization_id', orgId)
        .eq('role', 'supplier')
        .order('created_at', { ascending: false });

      rows.push(['ID Pemasok', 'Nama Pemasok', 'Barang / Material yang Disuplai', 'No. WhatsApp', 'Email', 'Alamat Gudang / Kantor', 'Terdaftar Pada']);
      if (suppliers) {
        suppliers.forEach(s => {
          rows.push([
            s.id,
            s.full_name || '-',
            s.supplier_goods || '-',
            s.whatsapp_number || '-',
            s.email || '-',
            s.address || '-',
            new Date(s.created_at).toLocaleDateString('id-ID')
          ]);
        });
      }
    }

    // Write to each configured sheet (Strictly agency's own spreadsheet)
    for (const config of configs) {
      let tabName = config.tab_projects || 'Projects';
      if (type === 'finance') tabName = config.tab_finance || 'Finance';
      if (type === 'operations') tabName = config.tab_operations || 'Operations';
      if (type === 'accounts') tabName = config.tab_accounts || 'Accounts';
      if (type === 'inventory') tabName = 'Master Stok Gudang';
      if (type === 'stock_mutations') tabName = 'Mutasi Stok Bahan';
      if (type === 'shipping') tabName = 'Logistik & Resi';
      if (type === 'maintenance') tabName = 'Laporan Mesin';
      if (type === 'suppliers') tabName = 'Direktori Pemasok';

      await clearAndWrite(config.sheet_id, tabName, rows);
    }

    return NextResponse.json({ success: true, message: `Ekspor ${type} ke Google Sheets berhasil disinkronkan.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
