import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

let env = {}
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].replace(/^["']|["']$/g, '').trim()
    }
  })
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// DEFINISI DATA 6 AGENSI & SUPER ADMIN
// ─────────────────────────────────────────────────────────────────────────────

const SUPER_ADMIN = {
  email: 'vylogixstudio@gmail.com',
  password: 'Bissmillah3323',
  full_name: 'Vylogix Platform Owner',
  role: 'super_admin',
}

const ORGANIZATIONS = [
  // 1 & 2: Agensi Digital
  {
    id: 'aaaaaaaa-0001-0001-0001-000000000001',
    name: 'Digital Studio A',
    slug: 'digital-studio-a',
    tagline: 'Solusi Rekayasa Digital & Software Kreatif',
    industry_type: 'DIGITAL',
    module_digital: true,
    module_physical: false,
    monthly_sales_target: 40000000,
    services: [
      { name: 'Pengembangan Web Portal E-Commerce', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'SaaS App Development & API', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'UI/UX Redesign & Figma Tokens', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Maintenance & Cloud Server Devops', service_category: 'DIGITAL', service_class: 'digital_umum' },
    ],
    accounts: [
      { role: 'admin', full_name: 'Ahmad Pratama', email: 'admin@digitalstudio-a.com', password: 'DigiA#Admin901!' },
      { role: 'staff_ops', full_name: 'Rina Agustina', email: 'ops@digitalstudio-a.com', password: 'DigiA#Ops234!' },
      { role: 'staff_digital', full_name: 'Fajar Nugraha', email: 'dev@digitalstudio-a.com', password: 'DigiA#Code567!' },
      { role: 'staff_finance', full_name: 'Siti Rahma', email: 'finance@digitalstudio-a.com', password: 'DigiA#Fin890!' },
    ],
    clients: [
      { role: 'client', full_name: 'PT Solusi Teknologi Nusantara', email: 'klien1@techcorp.id', password: 'KlienA1#Pass12!' },
      { role: 'client', full_name: 'IndoFoodies Creative Group', email: 'klien2@indofoodies.com', password: 'KlienA2#Pass34!' },
    ],
    projects: [
      {
        title: 'Pengembangan Web Portal E-Commerce & Dashboard Admin',
        service_type: 'Web Portal',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'development', // Tahap Produksi / Development
        progress_percentage: 55,
        total_price: 18500000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Next.js 15 & Supabase',
          preview_url: 'https://ecommerce-demo.digitalstudio-a.com',
          domain_name: 'solusinusantara-shop.com',
          domain_expiry_date: new Date(Date.now() + 300 * 86400000).toISOString().split('T')[0],
          hosting_info: 'Server Singapore Vultr (High Compute)',
          warranty_months: 6,
        },
      },
      {
        title: 'Sistem Informasi Manajemen Aset Cloud & Integrasi API',
        service_type: 'Web App',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'update_deploy', // Tahap Packing / Review / Deploy
        progress_percentage: 85,
        total_price: 12000000,
        payment_status: 'pending',
        clientIndex: 1,
        digital: {
          platform: 'Node.js Microservices',
          preview_url: 'https://asset-cloud.digitalstudio-a.com',
          domain_name: 'indofoodies-internal.net',
          domain_expiry_date: new Date(Date.now() + 200 * 86400000).toISOString().split('T')[0],
          hosting_info: 'VPS AWS Lightsail 4GB',
          warranty_months: 3,
        },
      },
      {
        title: 'Landing Page Interaktif Peluncuran Brand & SEO Optimization',
        service_type: 'Landing Page',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'completed', // Status Terkirim / Selesai
        progress_percentage: 100,
        total_price: 7500000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Astro & Tailwind',
          preview_url: 'https://brand-launch.digitalstudio-a.com',
          domain_name: 'nutrifood-launch.id',
          domain_expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          hosting_info: 'Vercel Edge Network Pro',
          warranty_months: 12,
        },
      },
    ],
  },
  {
    id: 'aaaaaaaa-0002-0002-0002-000000000002',
    name: 'Digital Studio B',
    slug: 'digital-studio-b',
    tagline: 'Transformasi UI/UX & Web Development Modern',
    industry_type: 'DIGITAL',
    module_digital: true,
    module_physical: false,
    monthly_sales_target: 35000000,
    services: [
      { name: 'UI/UX Design System & Mobile App Wireframing', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Custom ERP & POS Web System', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Company Profile & Web Branding', service_category: 'DIGITAL', service_class: 'digital_umum' },
    ],
    accounts: [
      { role: 'admin', full_name: 'Budi Santoso', email: 'admin@digitalstudio-b.com', password: 'DigiB#Admin112!' },
      { role: 'staff_ops', full_name: 'Dewi Lestari', email: 'ops@digitalstudio-b.com', password: 'DigiB#Ops334!' },
      { role: 'staff_digital', full_name: 'Eko Prasetyo', email: 'dev@digitalstudio-b.com', password: 'DigiB#Code678!' },
      { role: 'staff_finance', full_name: 'Maya Indah', email: 'finance@digitalstudio-b.com', password: 'DigiB#Fin991!' },
    ],
    clients: [
      { role: 'client', full_name: 'PT Kreasi Solusi Global', email: 'klien1@startupkreatif.id', password: 'KlienB1#Pass56!' },
      { role: 'client', full_name: 'Kuliner Nusantara Berkah', email: 'klien2@kulinernusantara.com', password: 'KlienB2#Pass78!' },
    ],
    projects: [
      {
        title: 'Aplikasi Mobile Reservasi Kafe & Loyalty Points',
        service_type: 'Mobile Web App',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'development', // Tahap Produksi
        progress_percentage: 45,
        total_price: 16000000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'React Native & Fastify',
          preview_url: 'https://reservasi-demo.digitalstudio-b.com',
          domain_name: 'kuliner-loyalty.app',
          domain_expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          hosting_info: 'DigitalOcean Droplet 8GB',
          warranty_months: 6,
        },
      },
      {
        title: 'UI/UX Redesign Portal Finansial & POS Multi-Outlet',
        service_type: 'UI/UX Design',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'update_deploy', // Tahap Packing / Review
        progress_percentage: 90,
        total_price: 9500000,
        payment_status: 'pending',
        clientIndex: 1,
        digital: {
          platform: 'Figma Design System & Tailwind UI',
          preview_url: 'https://figma.com/@digitalstudio-b/pos-redesign',
          warranty_months: 3,
        },
      },
      {
        title: 'Website Profil Perusahaan & Optimasi SEO Terpadu',
        service_type: 'Website Company',
        project_category: 'DIGITAL',
        service_class: 'digital_umum',
        status: 'completed', // Status Terkirim / Selesai
        progress_percentage: 100,
        total_price: 6000000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Next.js 15 Static Export',
          preview_url: 'https://global-solusi.id',
          domain_name: 'global-solusi.id',
          domain_expiry_date: new Date(Date.now() + 340 * 86400000).toISOString().split('T')[0],
          hosting_info: 'Cloudflare Pages Enterprise',
          warranty_months: 12,
        },
      },
    ],
  },

  // 3 & 4: Agensi Fisik
  {
    id: 'bbbbbbbb-0001-0001-0001-000000000001',
    name: 'Print Craft A',
    slug: 'print-craft-a',
    tagline: 'Spesialis Percetakan Hardbox, Offset & Packaging',
    industry_type: 'PHYSICAL',
    module_digital: false,
    module_physical: true,
    monthly_sales_target: 55000000,
    services: [
      { name: 'Cetak Hardbox Custom & Foil Emas', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Stiker Cutting Vinyl & Label Kemasan', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Buku Menu Restoran Hardcover & Jilid Baut', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Brosur Art Paper & Flyer Lipat', service_category: 'PHYSICAL', service_class: 'physical_umum' },
    ],
    inventory: [
      { name: 'Kertas Art Paper 150gr', category: 'Kertas', current_stock: 450, unit: 'Rim', min_stock_alert: 50 },
      { name: 'Karton Yellow Board No. 30', category: 'Bahan Baku Box', current_stock: 120, unit: 'Lembar', min_stock_alert: 20 },
      { name: 'Stiker Vinyl Glossy Ritrama', category: 'Stiker', current_stock: 35, unit: 'Roll', min_stock_alert: 5 },
      { name: 'Foil Gold Stamping Roll', category: 'Finishing', current_stock: 18, unit: 'Roll', min_stock_alert: 3 },
    ],
    accounts: [
      { role: 'admin', full_name: 'Chandra Wijaya', email: 'admin@printcraft-a.com', password: 'PrintA#Admin101!' },
      { role: 'staff_cs', full_name: 'Anisa Putri', email: 'cs@printcraft-a.com', password: 'PrintA#CS202!' },
      { role: 'staff_design', full_name: 'Gilang Maulana', email: 'desain@printcraft-a.com', password: 'PrintA#Des303!' },
      { role: 'staff_warehouse', full_name: 'Hendra Setiawan', email: 'gudang@printcraft-a.com', password: 'PrintA#Gud404!' },
      { role: 'staff_production', full_name: 'Irfan Hakim', email: 'produksi@printcraft-a.com', password: 'PrintA#Prod505!' },
      { role: 'staff_shipping', full_name: 'Joko Susilo', email: 'logistik@printcraft-a.com', password: 'PrintA#Log606!' },
      { role: 'staff_digital', full_name: 'Kiki Ramadhani', email: 'digital@printcraft-a.com', password: 'PrintA#Dig707!' },
    ],
    clients: [
      { role: 'client', full_name: 'Kopi Senja Group', email: 'klien1@kopisenja.com', password: 'KlienP1#Pass11!' },
      { role: 'client', full_name: 'Butik Cantik Indonesia', email: 'klien2@butikcantik.id', password: 'KlienP2#Pass22!' },
    ],
    projects: [
      {
        title: 'Cetak Dus Hardbox Premium & Gold Foil 1.000 Pcs',
        service_type: 'Hardbox Packaging',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'production', // Status 1: Tahap Produksi
        progress_percentage: 40,
        total_price: 8500000,
        payment_status: 'paid',
        clientIndex: 0,
        physical: {
          item_type: 'Hardbox Dus Magnetic',
          quantity: 1000,
          material_notes: 'Board No. 30 lapis Art Paper 150gr Doff + Hotprint Gold',
          size_notes: '22 x 15 x 7 cm',
          color_notes: 'Hitam Doff & Emas Metalik',
          shipping_status: 'WAITING',
          production_deadline: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
        },
      },
      {
        title: 'Stiker Cutting Vinyl Anti Air 5.000 Pcs & Label Botol',
        service_type: 'Stiker Vinyl',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'packing_completed', // Status 2: Tahap Packing
        progress_percentage: 85,
        total_price: 3800000,
        payment_status: 'paid',
        clientIndex: 1,
        physical: {
          item_type: 'Stiker Kiss Cut Vinyl',
          quantity: 5000,
          material_notes: 'Vinyl Ritrama Glossy Waterproof + Laminasi Dingin',
          size_notes: '5 x 5 cm bulat',
          color_notes: 'Full Color CMYK High Resolution',
          shipping_status: 'PACKING',
          production_deadline: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Mall Grand Indonesia Lantai 3, Jakarta Pusat',
        },
      },
      {
        title: 'Buku Menu Restoran Kulit Sintetis & Nota NCR 50 Rim',
        service_type: 'Buku Menu & Nota',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'completed', // Status 3: Terkirim
        progress_percentage: 100,
        total_price: 5200000,
        payment_status: 'paid',
        clientIndex: 0,
        physical: {
          item_type: 'Hardcover Menu Baut & Nota NCR 3 Ply',
          quantity: 50,
          material_notes: 'Cover Kulit Sintetis Emboss Logo + Isi Art Carton 310gr Laminasi Doff',
          size_notes: 'A4 & Folio NCR',
          color_notes: 'Dark Brown & Gold Emboss',
          shipping_status: 'DELIVERED',
          shipping_courier: 'JNE Express Cargo',
          tracking_number: 'JNE8829103991ID',
          shipping_address: 'Kopi Senja HQ, Jl. Riau No. 12, Bandung',
        },
      },
    ],
  },
  {
    id: 'bbbbbbbb-0002-0002-0002-000000000002',
    name: 'Print Craft B',
    slug: 'print-craft-b',
    tagline: 'Spesialis Konveksi, Sablon & Digital Textile Printing',
    industry_type: 'PHYSICAL',
    module_digital: false,
    module_physical: true,
    monthly_sales_target: 48000000,
    services: [
      { name: 'Konveksi Seragam Polo & Kemeja Bordir', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Paper Bag Kraft & Dus Kemasan Fresh', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Brosur & Flyer Lipat Tiga Promosi', service_category: 'PHYSICAL', service_class: 'physical_umum' },
    ],
    inventory: [
      { name: 'Kain Lacoste Pique CVC Navy', category: 'Kain Tekstil', current_stock: 320, unit: 'Kg', min_stock_alert: 40 },
      { name: 'Kain Katun Combed 30s Hitam', category: 'Kain Tekstil', current_stock: 250, unit: 'Kg', min_stock_alert: 30 },
      { name: 'Kertas Kraft 150gr Cokelat', category: 'Bahan Baku Paperbag', current_stock: 500, unit: 'Lembar', min_stock_alert: 60 },
      { name: 'Tinta DTF Textile Premium', category: 'Tinta Cetak', current_stock: 12, unit: 'Liter', min_stock_alert: 2 },
    ],
    accounts: [
      { role: 'admin', full_name: 'Lukman Hakim', email: 'admin@printcraft-b.com', password: 'PrintB#Admin888!' },
      { role: 'staff_cs', full_name: 'Mega Silvia', email: 'cs@printcraft-b.com', password: 'PrintB#CS777!' },
      { role: 'staff_design', full_name: 'Nanda Permana', email: 'desain@printcraft-b.com', password: 'PrintB#Des666!' },
      { role: 'staff_warehouse', full_name: 'Oscar Pandu', email: 'gudang@printcraft-b.com', password: 'PrintB#Gud555!' },
      { role: 'staff_production', full_name: 'Panji Gumilar', email: 'produksi@printcraft-b.com', password: 'PrintB#Prod444!' },
      { role: 'staff_shipping', full_name: 'Qori Anggoro', email: 'logistik@printcraft-b.com', password: 'PrintB#Log333!' },
      { role: 'staff_digital', full_name: 'Rian Kurniawan', email: 'digital@printcraft-b.com', password: 'PrintB#Dig222!' },
    ],
    clients: [
      { role: 'client', full_name: 'PT Garment Utama Perkasa', email: 'klien1@garmentutama.co.id', password: 'KlienPB1#Pass33!' },
      { role: 'client', full_name: 'Organik Farm Fresh', email: 'klien2@organikfarm.id', password: 'KlienPB2#Pass44!' },
    ],
    projects: [
      {
        title: 'Seragam Polo Bordir Komputer & Topi 200 Pcs',
        service_type: 'Konveksi Seragam',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'production', // Status 1: Tahap Produksi
        progress_percentage: 50,
        total_price: 14000000,
        payment_status: 'paid',
        clientIndex: 0,
        physical: {
          item_type: 'Kaos Polo Lacoste CVC 24s + Topi Drill',
          quantity: 200,
          material_notes: 'Bordir Komputer Tajima Dada Kiri & Punggung Atas',
          size_notes: 'S:30, M:70, L:70, XL:30',
          color_notes: 'Navy Blue & Aksen Putih',
          shipping_status: 'WAITING',
          production_deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Kawasan Industri MM2100 Blok C-4, Cikarang Barat',
        },
      },
      {
        title: 'Paper Bag Kraft Brown Sablon 2 Sisi 3.000 Pcs',
        service_type: 'Paper Bag Packaging',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'packing_completed', // Status 2: Tahap Packing
        progress_percentage: 85,
        total_price: 4500000,
        payment_status: 'paid',
        clientIndex: 1,
        physical: {
          item_type: 'Paperbag Kraft Cokelat Tali Kur',
          quantity: 3000,
          material_notes: 'Kraft Paper 150gr Sablon Hitam 2 Sisi + Alas Karton Tebal',
          size_notes: 'Panjang 25 x Lebar 10 x Tinggi 30 cm',
          color_notes: 'Eco Brown Kraft + Sablon Dark Eco Black',
          shipping_status: 'PACKING',
          production_deadline: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Organik Farm Hub, Jl. Pandanaran No. 88, Semarang',
        },
      },
      {
        title: 'Brosur Art Paper 150gr Lipat Tiga 10.000 Lembar',
        service_type: 'Brosur Promosi',
        project_category: 'PHYSICAL',
        service_class: 'physical_umum',
        status: 'completed', // Status 3: Terkirim
        progress_percentage: 100,
        total_price: 6750000,
        payment_status: 'paid',
        clientIndex: 0,
        physical: {
          item_type: 'Flyer Lipat Tiga (Z-Fold)',
          quantity: 10000,
          material_notes: 'Art Paper 150gr Full Color 2 Muka Vernis UV Waterbase',
          size_notes: 'Ukuran Terbuka A4 (21 x 29.7 cm)',
          color_notes: 'Full Color CMYK Offset Printing Heidelberg',
          shipping_status: 'DELIVERED',
          shipping_courier: 'SiCepat Cargo',
          tracking_number: 'SICEPAT-001928471',
          shipping_address: 'Gedung Wisma Perkasa Lt. 5, Surabaya',
        },
      },
    ],
  },

  // 5 & 6: Agensi Hybrid
  {
    id: 'cccccccc-0001-0001-0001-000000000001',
    name: 'Hybrid Media A',
    slug: 'hybrid-media-a',
    tagline: 'Ekosistem Agensi Terpadu: Digital Tech & Creative Printing',
    industry_type: 'HYBRID',
    module_digital: true,
    module_physical: true,
    monthly_sales_target: 75000000,
    services: [
      { name: 'Website Ticketing & QR Scanner Event', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Cetak Lanyard ID Card & Merchandise Event', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'App E-Katalog PWA & Brand Identity', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Standing Rollup Banner & Brosur Fresh', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Membership Portal Web API', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Kaos Cotton Combed 24s DTF & Tumbler Grafir', service_category: 'PHYSICAL', service_class: 'physical_umum' },
    ],
    inventory: [
      { name: 'Kartu PVC RFID 13.56MHz', category: 'Bahan Kartu', current_stock: 2200, unit: 'Pcs', min_stock_alert: 300 },
      { name: 'Tali Lanyard Polos 2cm Hitam', category: 'Aksesoris Event', current_stock: 4500, unit: 'Yard', min_stock_alert: 500 },
      { name: 'Kertas Art Carton 260gr', category: 'Kertas', current_stock: 350, unit: 'Rim', min_stock_alert: 40 },
    ],
    accounts: [
      { role: 'admin', full_name: 'Surya Dharma', email: 'admin@hybridmedia-a.com', password: 'HybA#Admin991!' },
      { role: 'staff_cs', full_name: 'Tania Maharani', email: 'cs-finance@hybridmedia-a.com', password: 'HybA#CSFin882!' },
      { role: 'staff_ops', full_name: 'Untung Suropati', email: 'ops@hybridmedia-a.com', password: 'HybA#Ops773!' },
      { role: 'staff_digital', full_name: 'Vicky Firmansyah', email: 'digital@hybridmedia-a.com', password: 'HybA#Dig664!' },
      { role: 'staff_design', full_name: 'Wahyu Hidayat', email: 'desain@hybridmedia-a.com', password: 'HybA#Des555!' },
      { role: 'staff_production', full_name: 'Xavier Danu', email: 'produksi@hybridmedia-a.com', password: 'HybA#Prod446!' },
      { role: 'staff_warehouse', full_name: 'Yoga Pratama', email: 'gudang@hybridmedia-a.com', password: 'HybA#Gud337!' },
      { role: 'staff_shipping', full_name: 'Zainal Abidin', email: 'logistik@hybridmedia-a.com', password: 'HybA#Log228!' },
    ],
    clients: [
      { role: 'client', full_name: 'PT Festival Media Kreasi', email: 'klien1@eventorganizer.co.id', password: 'KlienH1#Pass55!' },
      { role: 'client', full_name: 'Healthy Life Beverages', email: 'klien2@healthylife.id', password: 'KlienH2#Pass66!' },
    ],
    projects: [
      {
        title: 'Website Event Ticketing + Cetak 2.000 Lanyard ID Card & Merchandise',
        service_type: 'Hybrid Solution',
        project_category: 'PHYSICAL', // Valid category
        service_class: 'physical_umum',
        status: 'production', // Status 1: Tahap Produksi
        progress_percentage: 50,
        total_price: 28000000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Next.js App & QR Scanner Web',
          preview_url: 'https://fest-ticket.hybridmedia-a.com',
          domain_name: 'festivalkreasi2026.com',
          domain_expiry_date: new Date(Date.now() + 250 * 86400000).toISOString().split('T')[0],
          hosting_info: 'AWS ECS Cluster Singapore',
          warranty_months: 6,
        },
        physical: {
          item_type: 'Lanyard Tissue Printing 2cm + Kartu PVC Barcode',
          quantity: 2000,
          material_notes: 'Tali Lanyard Printing Sublimasi 2 Sisi + ID Card PVC Tebal Anti Air',
          size_notes: 'Tali 90cm, ID Card 8.5 x 5.4 cm',
          color_notes: 'Gradasi Neon Pink & Deep Purple',
          shipping_status: 'WAITING',
          production_deadline: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Istora Senayan Gate 5, Gelora Bung Karno, Jakarta',
        },
      },
      {
        title: 'Aplikasi Katalog Produk + Cetak Standing Banner & Brosur',
        service_type: 'Katalog & Cetak Promo',
        project_category: 'PHYSICAL', // Valid category
        service_class: 'physical_umum',
        status: 'ready_to_ship', // Status 2: Tahap Packing
        progress_percentage: 85,
        total_price: 15500000,
        payment_status: 'paid',
        clientIndex: 1,
        digital: {
          platform: 'PWA Mobile Catalog',
          preview_url: 'https://healthylife-catalog.hybridmedia-a.com',
          domain_name: 'katalog.healthylife.id',
          warranty_months: 3,
        },
        physical: {
          item_type: 'Roll Up Banner Alumunium 3 Set & Brosur 2.000 Lembar',
          quantity: 2003,
          material_notes: 'Banner Luster Albatros Anti Kerut + Brosur Art Paper 150gr',
          size_notes: 'Banner 85 x 200 cm, Brosur A5',
          color_notes: 'Fresh Green & Organic White',
          shipping_status: 'PACKING',
          production_deadline: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Healthy Life Central Hub, BSD City Kavling B-12, Tangerang',
        },
      },
      {
        title: 'Sistem Manajemen Keanggotaan + Cetak 500 Kaos & Tumbler',
        service_type: 'Portal & Merchandise Member',
        project_category: 'DIGITAL', // Valid category
        service_class: 'digital_umum',
        status: 'completed', // Status 3: Terkirim
        progress_percentage: 100,
        total_price: 21000000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Member Portal Web API',
          preview_url: 'https://member.festivalkreasi.com',
          domain_name: 'member.festivalkreasi.com',
          warranty_months: 12,
        },
        physical: {
          item_type: 'Kaos Cotton Combed 24s DTF & Tumbler Grafir Laser',
          quantity: 500,
          material_notes: 'Sablon DTF High Density + Tumbler Stainless Vacuum Flask 500ml',
          size_notes: 'Campur S-XXL',
          color_notes: 'Matte Black & Gold Laser Engraving',
          shipping_status: 'DELIVERED',
          shipping_courier: 'J&T Cargo',
          tracking_number: 'JNT9918273645',
          shipping_address: 'Event Organizer HQ, Kuningan, Jakarta Selatan',
        },
      },
    ],
  },
  {
    id: 'cccccccc-0002-0002-0002-000000000002',
    name: 'Hybrid Media B',
    slug: 'hybrid-media-b',
    tagline: 'Solusi Digitalisasi UMKM, Cetak & Branding Lengkap',
    industry_type: 'HYBRID',
    module_digital: true,
    module_physical: true,
    monthly_sales_target: 60000000,
    services: [
      { name: 'Platform Donasi Online & Payment Gateway', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Cetak Kotak Zakat & Brosur Kampanye', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Aplikasi QR Menu & Kasir POS Web', service_category: 'DIGITAL', service_class: 'digital_umum' },
      { name: 'Box Packaging Roti Foodgrade Custom', service_category: 'PHYSICAL', service_class: 'physical_umum' },
      { name: 'Website Toko Online & Seragam Barista', service_category: 'DIGITAL', service_class: 'digital_umum' },
    ],
    inventory: [
      { name: 'Karton Ivory Foodgrade 300gr', category: 'Kertas Makanan', current_stock: 800, unit: 'Lembar', min_stock_alert: 100 },
      { name: 'Kain Kanvas Drill Premium', category: 'Kain Apron', current_stock: 140, unit: 'Meter', min_stock_alert: 25 },
      { name: 'Akrilik Bening 3mm', category: 'Display Kasir', current_stock: 45, unit: 'Lembar', min_stock_alert: 8 },
    ],
    accounts: [
      { role: 'admin', full_name: 'Bayu Setyawan', email: 'admin@hybridmedia-b.com', password: 'HybB#Admin119!' },
      { role: 'staff_cs', full_name: 'Citra Kirana', email: 'cs-finance@hybridmedia-b.com', password: 'HybB#CSFin228!' },
      { role: 'staff_ops', full_name: 'Dimas Anggara', email: 'ops@hybridmedia-b.com', password: 'HybB#Ops337!' },
      { role: 'staff_digital', full_name: 'Erwin Gutawa', email: 'digital@hybridmedia-b.com', password: 'HybB#Dig446!' },
      { role: 'staff_design', full_name: 'Ferry Salim', email: 'desain@hybridmedia-b.com', password: 'HybB#Des555!' },
      { role: 'staff_production', full_name: 'Gading Marten', email: 'produksi@hybridmedia-b.com', password: 'HybB#Prod664!' },
      { role: 'staff_warehouse', full_name: 'Haris Ismail', email: 'gudang@hybridmedia-b.com', password: 'HybB#Gud773!' },
      { role: 'staff_shipping', full_name: 'Irfan Bachdim', email: 'logistik@hybridmedia-b.com', password: 'HybB#Log882!' },
    ],
    clients: [
      { role: 'client', full_name: 'Yayasan Peduli Insan Berkah', email: 'klien1@yayasanberkah.org', password: 'KlienHB1#Pass77!' },
      { role: 'client', full_name: 'Artisan Bakery Delight', email: 'klien2@bakerydelight.id', password: 'KlienHB2#Pass88!' },
    ],
    projects: [
      {
        title: 'Platform Donasi Online + Cetak 1.000 Kotak Zakat & Brosur Kampanye',
        service_type: 'Web Donasi & Packaging Zakat',
        project_category: 'PHYSICAL', // Valid category
        service_class: 'physical_umum',
        status: 'production', // Status 1: Tahap Produksi
        progress_percentage: 55,
        total_price: 24500000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Next.js & Payment Gateway Midtrans',
          preview_url: 'https://donasi-berkah.hybridmedia-b.com',
          domain_name: 'donasipeduli.org',
          domain_expiry_date: new Date(Date.now() + 320 * 86400000).toISOString().split('T')[0],
          hosting_info: 'GCP Cloud Run Serverless',
          warranty_months: 6,
        },
        physical: {
          item_type: 'Kotak Amal Akrilik + Sablon & Brosur Zakat 5.000 Lembar',
          quantity: 1000,
          material_notes: 'Kotak Corrugated E-Flute Lapis Art Paper Doff + Kunci Gembok Mini',
          size_notes: '20 x 15 x 20 cm',
          color_notes: 'Hijau Emerald & Emas',
          shipping_status: 'WAITING',
          production_deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Kantor Yayasan Berkah, Jl. Diponegoro No. 101, Yogyakarta',
        },
      },
      {
        title: 'Aplikasi QR Menu & Kasir + Box Packaging Roti 5.000 Pcs',
        service_type: 'App POS & Dus Roti',
        project_category: 'PHYSICAL', // Valid category
        service_class: 'physical_umum',
        status: 'ready_to_ship', // Status 2: Tahap Packing
        progress_percentage: 85,
        total_price: 19000000,
        payment_status: 'paid',
        clientIndex: 1,
        digital: {
          platform: 'QR Ordering Web App',
          preview_url: 'https://menu.bakerydelight.id',
          domain_name: 'menu.bakerydelight.id',
          warranty_months: 6,
        },
        physical: {
          item_type: 'Dus Roti Kemasan Foodgrade Window Mika',
          quantity: 5000,
          material_notes: 'Ivory 300gr Foodgrade + Mika Bening Atas + Cetak Soy Ink',
          size_notes: '22 x 11 x 8 cm',
          color_notes: 'Pastel Brown & Gold Hotprint Logo',
          shipping_status: 'PACKING',
          production_deadline: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          shipping_address: 'Artisan Bakery Outlet 1, Jl. Kemang Raya No. 24, Jakarta Selatan',
        },
      },
      {
        title: 'Website Toko Online + Cetak Seragam Barista & Apron',
        service_type: 'E-Commerce & Uniform',
        project_category: 'DIGITAL', // Valid category
        service_class: 'digital_umum',
        status: 'completed', // Status 3: Terkirim
        progress_percentage: 100,
        total_price: 16800000,
        payment_status: 'paid',
        clientIndex: 0,
        digital: {
          platform: 'Shopify / Custom Next.js Commerce',
          preview_url: 'https://shop.bakerydelight.id',
          domain_name: 'bakerydelight.id',
          warranty_months: 12,
        },
        physical: {
          item_type: 'Apron Kanvas Drill + Bordir Logo & Kemeja Barista',
          quantity: 50,
          material_notes: 'Kanvas Drill Katun Tebal dengan Tali Kulit Sintetis & Gesper Kuningan',
          size_notes: 'All Size Adjustable',
          color_notes: 'Dark Olive Green & Cokelat Tan',
          shipping_status: 'DELIVERED',
          shipping_courier: 'POS Indonesia Express',
          tracking_number: 'POS-EXPRESS-8827163',
          shipping_address: 'Artisan Bakery Central Kitchen, Sleman, DIY',
        },
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: CREATE OR UPDATE AUTH USER & PROFILE
// ─────────────────────────────────────────────────────────────────────────────

async function upsertUser({ email, password, full_name, role, organization_id = null }) {
  // 1. Cek apakah user sudah ada di auth.users
  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
  if (listErr) {
    console.error(`❌ Gagal mengambil daftar auth user:`, listErr)
    return null
  }

  const existingUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  let userId = null

  if (existingUser) {
    userId = existingUser.id
    console.log(`  ℹ️  User auth ditemukan: ${email} (${userId}). Mengupdate password...`)
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: { full_name, role },
      email_confirm: true,
    })
    if (updErr) {
      console.warn(`     ⚠️  Gagal update password ${email}: ${updErr.message}`)
    }
  } else {
    console.log(`  ✨ Membuat user auth baru: ${email}...`)
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (createErr) {
      console.error(`     ❌ Gagal membuat auth user ${email}: ${createErr.message}`)
      return null
    }
    userId = createData.user.id
  }

  // 2. Upsert ke tabel profiles
  const { error: profErr } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name,
      role,
      organization_id,
    },
    { onConflict: 'id' }
  )

  if (profErr) {
    console.error(`     ❌ Gagal upsert profiles untuk ${email}:`, profErr.message)
  } else {
    console.log(`     ✅ Profile disinkronkan (${role}) - Org: ${organization_id ? organization_id.substring(0, 8) + '...' : 'Global'}`)
  }

  return userId
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function runSeed() {
  console.log('════════════════════════════════════════════════════════════════════')
  console.log('🚀 MEMULAI SEEDER 6 TENANT VYLOGIX ECOSYSTEM + FAST ACCOUNT SETUP')
  console.log('════════════════════════════════════════════════════════════════════\n')

  // 1. SEED SUPER ADMIN (GLOBAL PLATFORM)
  console.log('👑 [1/4] Menyinkronkan Akun Super Admin Platform...')
  const superAdminId = await upsertUser({
    email: SUPER_ADMIN.email,
    password: SUPER_ADMIN.password,
    full_name: SUPER_ADMIN.full_name,
    role: SUPER_ADMIN.role,
    organization_id: null,
  })

  // 2. SEED 6 ORGANISASI
  console.log('\n🏢 [2/4] Menyinkronkan 6 Organisasi (2 Digital, 2 Fisik, 2 Hybrid)...')
  for (const org of ORGANIZATIONS) {
    console.log(`\n────────────────────────────────────────────────────────────────────`)
    console.log(`🏢 Organisasi: ${org.name} (${org.industry_type})`)
    console.log(`────────────────────────────────────────────────────────────────────`)

    // Upsert Organization
    const { error: orgErr } = await supabaseAdmin.from('organizations').upsert(
      {
        id: org.id,
        name: org.name,
        slug: org.slug,
        tagline: org.tagline,
        industry_type: org.industry_type,
        module_digital: org.module_digital,
        module_physical: org.module_physical,
        monthly_sales_target: org.monthly_sales_target,
        is_active: true,
      },
      { onConflict: 'id' }
    )

    if (orgErr) {
      console.error(`❌ Gagal upsert organization ${org.name}:`, orgErr.message)
      continue
    }
    console.log(`  ✅ Organization ${org.name} tersimpan.`)

    // Upsert Agency Services
    if (org.services && org.services.length > 0) {
      // Hapus layanan lama agar rapi
      await supabaseAdmin.from('agency_services').delete().eq('organization_id', org.id)
      const serviceRecords = org.services.map(s => ({
        organization_id: org.id,
        name: s.name,
        service_category: s.service_category,
        service_class: s.service_class || 'digital_umum',
      }))
      const { error: srvErr } = await supabaseAdmin.from('agency_services').insert(serviceRecords)
      if (srvErr) console.warn(`  ⚠️  Gagal insert services: ${srvErr.message}`)
      else console.log(`  ✅ ${serviceRecords.length} layanan agensi tersimpan.`)
    }

    // Upsert Inventory Items (Jika Fisik / Hybrid)
    if (org.inventory && org.inventory.length > 0) {
      for (const inv of org.inventory) {
        const { data: existingInv } = await supabaseAdmin
          .from('inventory_items')
          .select('id')
          .eq('organization_id', org.id)
          .eq('name', inv.name)
          .maybeSingle()

        if (!existingInv) {
          await supabaseAdmin.from('inventory_items').insert({
            organization_id: org.id,
            name: inv.name,
            category: inv.category,
            current_stock: inv.current_stock,
            unit: inv.unit,
            min_stock_alert: inv.min_stock_alert,
          })
        }
      }
      console.log(`  ✅ Master stok gudang tersimpan.`)
    }

    // 3. SEED STAFF ACCOUNTS
    console.log(`\n  👥 Mendaftarkan Akun Staf & Role Khusus...`)
    for (const acc of org.accounts) {
      await upsertUser({
        email: acc.email,
        password: acc.password,
        full_name: acc.full_name,
        role: acc.role,
        organization_id: org.id,
      })
    }

    // 4. SEED CLIENT ACCOUNTS
    console.log(`\n  🤝 Mendaftarkan 2 Akun Klien Unik...`)
    const clientUserIds = []
    for (const cli of org.clients) {
      const cliId = await upsertUser({
        email: cli.email,
        password: cli.password,
        full_name: cli.full_name,
        role: cli.role,
        organization_id: org.id,
      })
      if (cliId) clientUserIds.push(cliId)
    }

    // 5. SEED 3 ORDERS / TRANSAKSI DEMO
    console.log(`\n  📦 Membuat 3 Pesanan Demo (${org.projects.map(p => p.status).join(', ')})...`)
    for (let i = 0; i < org.projects.length; i++) {
      const p = org.projects[i]
      const clientId = clientUserIds[p.clientIndex] || clientUserIds[0]

      if (!clientId) {
        console.warn(`  ⚠️  Klien tidak tersedia untuk proyek ${p.title}`)
        continue
      }

      // Check if project title already exists for this org
      const { data: existingProj } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('organization_id', org.id)
        .eq('title', p.title)
        .maybeSingle()

      let projectId = existingProj?.id

      if (!projectId) {
        const { data: newProj, error: pErr } = await supabaseAdmin
          .from('projects')
          .insert({
            organization_id: org.id,
            client_id: clientId,
            title: p.title,
            service_type: p.service_type,
            project_category: p.project_category,
            service_class: p.service_class || 'digital_umum',
            status: p.status,
            progress_percentage: p.progress_percentage,
            total_price: p.total_price,
            payment_status: p.payment_status,
            deadline: new Date(Date.now() + (i + 1) * 5 * 86400000).toISOString().split('T')[0],
            created_at: new Date(Date.now() - (3 - i) * 7 * 86400000).toISOString(),
          })
          .select()
          .single()

        if (pErr) {
          console.error(`  ❌ Gagal membuat project ${p.title}:`, pErr.message)
          continue
        }
        projectId = newProj.id
      } else {
        // Update status & progress
        await supabaseAdmin.from('projects').update({
          status: p.status,
          progress_percentage: p.progress_percentage,
          payment_status: p.payment_status,
        }).eq('id', projectId)
      }

      console.log(`    🔹 Project [${i + 1}/3] "${p.title.substring(0, 35)}..." [Status: ${p.status}]`)

      // Insert Project Digital Details jika ada
      if (p.digital) {
        await supabaseAdmin.from('project_digital_details').upsert(
          {
            project_id: projectId,
            platform: p.digital.platform || null,
            preview_url: p.digital.preview_url || null,
            domain_name: p.digital.domain_name || null,
            domain_expiry_date: p.digital.domain_expiry_date || null,
            hosting_info: p.digital.hosting_info || null,
            warranty_months: p.digital.warranty_months || 0,
          },
          { onConflict: 'project_id' }
        )
      }

      // Insert Project Physical Details jika ada
      if (p.physical) {
        await supabaseAdmin.from('project_physical_details').upsert(
          {
            project_id: projectId,
            item_type: p.physical.item_type || null,
            quantity: p.physical.quantity || 1,
            material_notes: p.physical.material_notes || null,
            size_notes: p.physical.size_notes || null,
            color_notes: p.physical.color_notes || null,
            shipping_status: p.physical.shipping_status || 'WAITING',
            shipping_courier: p.physical.shipping_courier || null,
            tracking_number: p.physical.tracking_number || null,
            shipping_address: p.physical.shipping_address || null,
            production_deadline: p.physical.production_deadline || null,
          },
          { onConflict: 'project_id' }
        )
      }

      // Insert Invoice & Income Transaction
      const invNum = `INV/${org.slug.toUpperCase()}/${new Date().getFullYear()}/00${i + 1}`
      const { data: invData } = await supabaseAdmin.from('fin_invoices').upsert(
        {
          organization_id: org.id,
          client_id: clientId,
          project_id: projectId,
          invoice_number: invNum,
          title: `Faktur Pembayaran — ${p.title}`,
          amount: p.total_price,
          status: p.payment_status === 'paid' ? 'PAID' : 'PENDING',
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
        { onConflict: 'organization_id, invoice_number' }
      ).select().maybeSingle()

      if (invData && p.payment_status === 'paid') {
        // Cek apakah transaksi sudah tercatat
        const { data: existingTx } = await supabaseAdmin
          .from('fin_transactions')
          .select('id')
          .eq('organization_id', org.id)
          .eq('reference_id', invData.id)
          .maybeSingle()

        if (!existingTx) {
          await supabaseAdmin.from('fin_transactions').insert({
            organization_id: org.id,
            type: 'INCOME',
            amount: p.total_price,
            description: `Pelunasan Invoice ${invNum} (${p.title})`,
            reference_id: invData.id,
            reference_type: 'INVOICE',
          })
        }
      }

      // Insert Internal Note
      await supabaseAdmin.from('internal_notes').insert({
        project_id: projectId,
        organization_id: org.id,
        author_id: superAdminId || clientId,
        content: `Pesanan telah disinkronkan ke sistem dengan status ${p.status.toUpperCase()}.`,
        visible_to_client: true,
      })
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════════')
  console.log('🎉 SEEDING SELESAI DENGAN SUKSES!')
  console.log('════════════════════════════════════════════════════════════════════')
  console.log('Semua 6 Tenant Agensi, seluruh akun staf dengan password unik, 2 klien unik')
  console.log('dan 3 pesanan/transaksi per agensi siap diuji via Fast Account Switcher!\n')
}

runSeed().catch(err => {
  console.error('❌ Terjadi kesalahan saat seeding:', err)
  process.exit(1)
})
