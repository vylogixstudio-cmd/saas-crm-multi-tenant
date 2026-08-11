import { 
  LayoutDashboard, Briefcase, CheckCircle, 
  ShoppingCart, Users, CreditCard, 
  ClipboardList, Settings, Package, Truck, Boxes,
  Globe, Wrench, FileText, Building2, Trash2, SplitSquareHorizontal, PenTool,
  PlusCircle, MessageSquare, CheckSquare, Calendar, BarChart2, MessageCircle, Cloud, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Factory, Activity, Hand, ShieldCheck, Box, Printer, CheckCircle2, PackageCheck
} from 'lucide-react'

export interface NavItem {
  name: string
  href?: string
  icon: any
  permission: string | null
  subItems?: { name: string, href: string, icon: any }[]
  isSubMenu?: boolean
}

// Digital Operations
export const DIGITAL_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Tim & Staf', href: '/dashboard/team', icon: Users, permission: null },
  { name: 'Proyek Aktif', href: '/dashboard/projects', icon: Briefcase, permission: 'projects.read' },
  { name: 'Update Proyek', href: '/dashboard/updates', icon: Wrench, permission: 'projects.read' },
  { name: 'Domain & Server', href: '/dashboard/infrastructure', icon: Globe, permission: 'projects.read' },
  { name: 'Proyek Selesai', href: '/dashboard/projects/completed', icon: CheckCircle, permission: 'projects.read' },
  { name: 'Klien (CRM)', href: '/dashboard/clients', icon: Users, permission: 'projects.read' },
  
  // Finance Modules
  { name: 'Pantau Tagihan', href: '/dashboard/ops-billing', icon: FileText, permission: null },
  { 
    name: 'Kasir / POS', 
    icon: ShoppingCart, 
    permission: 'finance.manage',
    subItems: [
      { name: 'Invoice Manual', href: '/dashboard/pos?tab=manual', icon: FileText },
      { name: 'Tagihan Proyek', href: '/dashboard/pos?tab=project', icon: Building2 },
      { name: 'Konfirmasi Lunas', href: '/dashboard/pos?tab=confirmation', icon: CheckCircle },
      { name: 'Dibatalkan', href: '/dashboard/pos?tab=cancelled', icon: Trash2 },
      { name: 'Cicilan Klien', href: '/dashboard/pos?tab=client_split', icon: SplitSquareHorizontal },
      { name: 'Buku Besar (Keuangan)', href: '/dashboard/finance', icon: CreditCard },
    ]
  },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  
  // Settings & Logs
  { name: 'Log Aktivitas', href: '/dashboard/audit', icon: ClipboardList, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

// Physical Operations
export const PHYSICAL_NAVIGATION: NavItem[] = [
  { name: 'Dasbor', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Tim & Staf', href: '/dashboard/team', icon: Users, permission: null },
  
  { name: 'Pesanan Masuk', href: '/dashboard/projects', icon: Briefcase, permission: 'projects.read' },
  { name: 'Manajemen Stok', href: '/dashboard/inventory', icon: Package, permission: 'warehouse.read' },
  { name: 'Pesanan Aktif (Produksi)', href: '/dashboard/production', icon: Boxes, permission: 'production.read' },
  { name: 'Riwayat Pesanan', href: '/dashboard/projects/completed', icon: CheckCircle, permission: 'projects.read' },
  { name: 'Kalender Deadline', href: '/dashboard/calendar', icon: Calendar, permission: 'projects.read' },
  { name: 'Laporan Kinerja', href: '/dashboard/performance', icon: BarChart2, permission: 'projects.read' },
  
  { name: 'Klien & Pemasok', href: '/dashboard/clients', icon: Users, permission: 'projects.read' },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  
  // Finance Modules
  { name: 'Pantau Tagihan', href: '/dashboard/ops-billing', icon: FileText, permission: null },
  { 
    name: 'Kasir / POS', 
    icon: ShoppingCart, 
    permission: 'finance.manage',
    subItems: [
      { name: 'Faktur Manual', href: '/dashboard/pos?tab=manual', icon: FileText },
      { name: 'Tagihan Proyek', href: '/dashboard/pos?tab=project', icon: Building2 },
      { name: 'Konfirmasi Lunas', href: '/dashboard/pos?tab=confirmation', icon: CheckCircle },
      { name: 'Dibatalkan', href: '/dashboard/pos?tab=cancelled', icon: Trash2 },
      { name: 'Cicilan Klien', href: '/dashboard/pos?tab=client_split', icon: SplitSquareHorizontal },
      { name: 'Buku Besar (Keuangan)', href: '/dashboard/finance', icon: CreditCard },
    ]
  },
  
  // Settings & Logs
  { name: 'Log Aktivitas', href: '/dashboard/audit', icon: ClipboardList, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

// ==========================================
// ROLE-SPECIFIC PHYSICAL NAVIGATION (STAF)
// ==========================================

export const PHYSICAL_STAFF_CS: NavItem[] = [
  { name: 'Dashboard CS', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Manajemen Klien (CRM)', href: '/dashboard/clients', icon: Users, permission: null },
  { name: 'Pesanan Masuk', href: '/dashboard/projects', icon: Briefcase, permission: null },
  { name: 'Pesanan Aktif (Produksi)', href: '/dashboard/production', icon: Boxes, permission: null },
  { name: 'Riwayat Pesanan', href: '/dashboard/projects/completed', icon: CheckCircle, permission: null },
  { 
    name: 'Kasir (POS) & Tagihan', 
    icon: ShoppingCart, 
    permission: null,
    subItems: [
      { name: 'Invoice Manual', href: '/dashboard/pos?tab=manual', icon: FileText },
      { name: 'Tagihan Proyek', href: '/dashboard/pos?tab=project', icon: Building2 },
      { name: 'Konfirmasi Lunas', href: '/dashboard/pos?tab=confirmation', icon: CheckCircle },
      { name: 'Dibatalkan', href: '/dashboard/pos?tab=cancelled', icon: Trash2 },
      { name: 'Cicilan Klien', href: '/dashboard/pos?tab=client_split', icon: SplitSquareHorizontal },
      { name: 'Buku Besar (Keuangan)', href: '/dashboard/finance', icon: CreditCard },
    ]
  },
  { name: 'Pengajuan Dana Ops', href: '/dashboard/finance/procurement', icon: FileText, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const PHYSICAL_STAFF_OPS: NavItem[] = [
  { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Pantau Proyek Klien', href: '/dashboard/projects', icon: Briefcase, permission: null },
  { name: 'Pantau Stok Gudang', href: '/dashboard/inventory', icon: Package, permission: null },
  { name: 'Pengajuan Belanja (Dana)', href: '/dashboard/ops/procurement', icon: FileText, permission: null },
  { name: 'Laporan Mesin', href: '/dashboard/production/maintenance', icon: Wrench, permission: null },
  { name: 'Kalender Deadline', href: '/dashboard/calendar', icon: Calendar, permission: null },
  { name: 'Laporan Kinerja', href: '/dashboard/performance', icon: BarChart2, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const PHYSICAL_STAFF_DESIGN: NavItem[] = [
  { name: 'Dashboard Desain', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Studio & Mockup', href: '/dashboard/design', icon: PenTool, permission: null },
  { name: 'Riwayat Pesanan', href: '/dashboard/projects/completed', icon: ClipboardList, permission: null },
  { name: 'Aset File (Cloud)', href: '/dashboard/design/assets', icon: Cloud, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const PHYSICAL_STAFF_WAREHOUSE: NavItem[] = [
  { name: 'Dashboard Gudang', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { 
    name: 'Manajemen Gudang', 
    icon: Package, 
    permission: null,
    subItems: [
      { name: 'Master Material', href: '/dashboard/inventory', icon: Package },
      { name: 'Barang Masuk', href: '/dashboard/inventory/inbound', icon: ArrowDownToLine },
      { name: 'Pengeluaran', href: '/dashboard/inventory/outbound', icon: ArrowUpFromLine },
      { name: 'Stock Opname', href: '/dashboard/inventory/opname', icon: ClipboardCheck },
    ]
  },
  { name: 'Pantau Produksi', href: '/dashboard/production', icon: Factory, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const PHYSICAL_STAFF_PRODUCTION: NavItem[] = [
  { name: 'Dashboard Produksi', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Antrean Produksi', href: '/dashboard/production', icon: Factory, permission: null },
  { name: 'Riwayat Pesanan', href: '/dashboard/projects/completed', icon: ClipboardList, permission: null },
  { name: 'Request Bahan', href: '/dashboard/inventory/outbound', icon: Hand, permission: null },
  { name: 'Quality Control (QC)', href: '/dashboard/production/qc', icon: ShieldCheck, permission: null },
  { name: 'Mesin & Perawatan', href: '/dashboard/production/maintenance', icon: Wrench, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const PHYSICAL_STAFF_SHIPPING: NavItem[] = [
  { name: 'Dashboard Ekspedisi', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Antrean Packing', href: '/dashboard/packing', icon: Box, permission: null },
  { name: 'Cetak Label', href: '/dashboard/shipping/labels', icon: Printer, permission: null },
  { name: 'Pengiriman & Resi', href: '/dashboard/shipping', icon: Truck, permission: null },
  { name: 'Konfirmasi Diterima', href: '/dashboard/shipping/confirmation', icon: CheckCircle2, permission: null },
  { name: 'Riwayat Pengiriman', href: '/dashboard/shipping/history', icon: PackageCheck, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export function getPhysicalNavigation(role: string | null | undefined): NavItem[] {
  if (!role) return PHYSICAL_NAVIGATION;
  
  switch (role) {
    case 'staff_cs':
      return PHYSICAL_STAFF_CS;
    case 'staff_ops':
      return PHYSICAL_STAFF_OPS;
    case 'staff_design':
      return PHYSICAL_STAFF_DESIGN;
    case 'staff_warehouse':
      return PHYSICAL_STAFF_WAREHOUSE;
    case 'staff_production':
      return PHYSICAL_STAFF_PRODUCTION;
    case 'staff_shipping':
      return PHYSICAL_STAFF_SHIPPING;
    // Admin, super_admin, or any other roles get the master view
    default:
      return PHYSICAL_NAVIGATION;
  }
}

// Hybrid Modules (Kombinasi Digital & Physical)
export const HYBRID_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Tim & Staf', href: '/dashboard/team', icon: Users, permission: null },
  
  // Digital
  { name: 'Proyek Aktif', href: '/dashboard/projects', icon: Briefcase, permission: 'projects.read' },
  { name: 'Update Proyek', href: '/dashboard/updates', icon: Wrench, permission: 'projects.read' },
  { name: 'Domain & Server', href: '/dashboard/infrastructure', icon: Globe, permission: 'projects.read' },
  { name: 'Proyek Selesai', href: '/dashboard/projects/completed', icon: CheckCircle, permission: 'projects.read' },
  
  // Physical
  { name: 'Desain Fisik', href: '/dashboard/design', icon: PenTool, permission: 'design.read' },
  { name: 'Produksi', href: '/dashboard/production', icon: Boxes, permission: 'production.read' },
  { name: 'Gudang & Stok', href: '/dashboard/inventory', icon: Package, permission: 'warehouse.read' },
  { name: 'Packing', href: '/dashboard/packing', icon: Package, permission: 'packing.read' },
  { name: 'Pengiriman', href: '/dashboard/shipping', icon: Truck, permission: 'shipping.read' },
  
  { name: 'Klien (CRM)', href: '/dashboard/clients', icon: Users, permission: 'projects.read' },
  
  // Finance Modules
  { name: 'Pantau Tagihan', href: '/dashboard/ops-billing', icon: FileText, permission: null },
  { 
    name: 'Kasir / POS', 
    icon: ShoppingCart, 
    permission: 'finance.manage',
    subItems: [
      { name: 'Invoice Manual', href: '/dashboard/pos?tab=manual', icon: FileText },
      { name: 'Tagihan Proyek', href: '/dashboard/pos?tab=project', icon: Building2 },
      { name: 'Konfirmasi Lunas', href: '/dashboard/pos?tab=confirmation', icon: CheckCircle },
      { name: 'Dibatalkan', href: '/dashboard/pos?tab=cancelled', icon: Trash2 },
      { name: 'Cicilan Klien', href: '/dashboard/pos?tab=client_split', icon: SplitSquareHorizontal },
    ]
  },
  { name: 'Keuangan', href: '/dashboard/finance', icon: CreditCard, permission: 'finance.read' },
  
  // Settings & Logs
  { name: 'Log Aktivitas', href: '/dashboard/audit', icon: ClipboardList, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

// ==========================================
// ROLE-SPECIFIC HYBRID NAVIGATION (STAF)
// ==========================================

// Hybrid CS: gabungan CS Fisik + Finance Digital
export const HYBRID_STAFF_CS: NavItem[] = [
  { name: 'Dashboard CS', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Manajemen Klien (CRM)', href: '/dashboard/clients', icon: Users, permission: null },
  { name: 'Pesanan Masuk', href: '/dashboard/projects', icon: Briefcase, permission: null },
  { name: 'Pesanan Aktif (Produksi)', href: '/dashboard/production', icon: Boxes, permission: null },
  { name: 'Riwayat Pesanan', href: '/dashboard/projects/completed', icon: CheckCircle, permission: null },
  { 
    name: 'Kasir (POS) & Tagihan', 
    icon: ShoppingCart, 
    permission: null,
    subItems: [
      { name: 'Invoice Manual', href: '/dashboard/pos?tab=manual', icon: FileText },
      { name: 'Tagihan Proyek', href: '/dashboard/pos?tab=project', icon: Building2 },
      { name: 'Konfirmasi Lunas', href: '/dashboard/pos?tab=confirmation', icon: CheckCircle },
      { name: 'Dibatalkan', href: '/dashboard/pos?tab=cancelled', icon: Trash2 },
      { name: 'Cicilan Klien', href: '/dashboard/pos?tab=client_split', icon: SplitSquareHorizontal },
      { name: 'Buku Besar (Keuangan)', href: '/dashboard/finance', icon: CreditCard },
    ]
  },
  { name: 'Pengajuan Dana Ops', href: '/dashboard/finance/procurement', icon: FileText, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

// Hybrid Ops: gabungan Ops Digital + Ops Fisik
export const HYBRID_STAFF_OPS: NavItem[] = [
  { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard, permission: null },
  // Digital
  { name: 'Proyek Aktif', href: '/dashboard/projects', icon: Briefcase, permission: null },
  { name: 'Update Proyek', href: '/dashboard/updates', icon: Wrench, permission: null },
  { name: 'Domain & Server', href: '/dashboard/infrastructure', icon: Globe, permission: null },
  // Fisik
  { name: 'Pantau Stok Gudang', href: '/dashboard/inventory', icon: Package, permission: null },
  { name: 'Pengajuan Belanja (Dana)', href: '/dashboard/ops/procurement', icon: FileText, permission: null },
  { name: 'Laporan Mesin', href: '/dashboard/production/maintenance', icon: Wrench, permission: null },
  { name: 'Kalender Deadline', href: '/dashboard/calendar', icon: Calendar, permission: null },
  { name: 'Laporan Kinerja', href: '/dashboard/performance', icon: BarChart2, permission: null },
  // Finance (ops bisa monitor tagihan)
  { name: 'Pantau Tagihan', href: '/dashboard/ops-billing', icon: FileText, permission: null },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export const HYBRID_STAFF_EXECUTOR_NAVIGATION: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Proyek Aktif', href: '/dashboard/projects', icon: Briefcase, permission: 'projects.read' },
  { name: 'Proyek Selesai', href: '/dashboard/projects/completed', icon: CheckCircle, permission: 'projects.read' },
  { name: 'Pesan & Catatan', href: '/dashboard/messages', icon: MessageSquare, permission: null },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, permission: null },
]

export function getHybridNavigation(role: string | null | undefined): NavItem[] {
  if (!role) return HYBRID_NAVIGATION;

  switch (role) {
    case 'staff_cs':
      return HYBRID_STAFF_CS;
    case 'staff_ops':
      return HYBRID_STAFF_OPS;
    // Role berikut tetap pakai nav fisik spesifik mereka (tidak berubah)
    case 'staff_design':
      return PHYSICAL_STAFF_DESIGN;
    case 'staff_warehouse':
      return PHYSICAL_STAFF_WAREHOUSE;
    case 'staff_production':
      return PHYSICAL_STAFF_PRODUCTION;
    case 'staff_shipping':
      return PHYSICAL_STAFF_SHIPPING;
    // Eksekutor pakai nav khusus
    case 'staff_executor':
      return HYBRID_STAFF_EXECUTOR_NAVIGATION;
    case 'staff_digital':
      return DIGITAL_NAVIGATION;
    // Admin, super_admin → menu master hybrid
    default:
      return HYBRID_NAVIGATION;
  }
}
