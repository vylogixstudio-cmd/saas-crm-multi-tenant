-- ============================================================
-- VYLOGIX CRM — DEMO ENVIRONMENT RESET & SETUP (6 TENANTS ECOSYSTEM)
--
-- JALANKAN: node seed_6_tenants_ecosystem.mjs ATAU node setup_demo_auth.mjs
-- (Script Node.js tersebut akan otomatis membuat Auth & Database profiles secara langsung!)
--
-- File SQL ini sebagai referensi struktur 6 Organisasi & Layanan Agensi.
-- ============================================================

-- 1. Membersihkan Data Demo Lama
DELETE FROM fin_transactions;
DELETE FROM fin_invoice_items;
DELETE FROM fin_invoices;
DELETE FROM internal_notes;
DELETE FROM project_digital_details;
DELETE FROM project_physical_details;
DELETE FROM inventory_mutations;
DELETE FROM inventory_items;
DELETE FROM projects;
DELETE FROM agency_services;
DELETE FROM profiles WHERE role != 'super_admin';
DELETE FROM organizations;

-- 2. Membikin 6 Organisasi (2 Digital, 2 Fisik, 2 Hybrid)
INSERT INTO organizations (id, name, slug, tagline, is_active, industry_type, module_digital, module_physical, monthly_sales_target, created_at) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Kreativ Studio',           'kreativ-studio',   'Solusi Digital Kreatif Terpercaya', true, 'DIGITAL',  true,  false, 35000000, now()),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'PixelForge Studio',       'pixelforge-studio', 'Digital UI/UX & Web Development', true, 'DIGITAL',  true,  false, 25000000, now()),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'PrintMaster Co',          'printmaster-co',    'Cetak & Digital Printing Modern',   true, 'PHYSICAL', false, true,  50000000, now()),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Berkah Konveksi & Sablon', 'berkah-konveksi',   'Pakaian, Uniform & Merchandising',  true, 'PHYSICAL', false, true,  40000000, now()),
  ('cccccccc-0001-0001-0001-000000000001', 'OmniWorks Agency',        'omniworks-agency',  'Layanan Agensi Hybrid Terlengkap',  true, 'HYBRID',   true,  true,  65000000, now()),
  ('cccccccc-0002-0002-0002-000000000002', 'Sinergi Media Kreatif',    'sinergi-media',     'Media & Branding Digital-Fisik',    true, 'HYBRID',   true,  true,  45000000, now());

-- 3. Insert Layanan Agensi per Tenant
INSERT INTO agency_services (organization_id, name, service_category) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Pembuatan Website Portal',  'DIGITAL'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Maintenance & Web App',     'DIGITAL'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Landing Page Company',      'DIGITAL'),

  ('aaaaaaaa-0002-0002-0002-000000000002', 'Aplikasi Web & QR Ordering', 'DIGITAL'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'UI/UX Design & Figma Tokens','DIGITAL'),

  ('bbbbbbbb-0001-0001-0001-000000000001', 'Cetak Buku Menu Hardcover',  'PHYSICAL'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'ID Card & Merchandise PVC', 'PHYSICAL'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Brosur & Flyer Lipat 3',    'PHYSICAL'),

  ('bbbbbbbb-0002-0002-0002-000000000002', 'Konveksi Jersey & Sablon',  'PHYSICAL'),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Seragam Olahraga Sekolah',   'PHYSICAL'),

  ('cccccccc-0001-0001-0001-000000000001', 'Website E-Commerce',        'DIGITAL'),
  ('cccccccc-0001-0001-0001-000000000001', 'Packaging Hardbox Custom',  'PHYSICAL'),
  ('cccccccc-0001-0001-0001-000000000001', 'Web Portal Internal',       'DIGITAL'),
  ('cccccccc-0001-0001-0001-000000000001', 'Kaos Polo Uniform',         'PHYSICAL'),

  ('cccccccc-0002-0002-0002-000000000002', 'Website Donasi & Zakat',    'DIGITAL'),
  ('cccccccc-0002-0002-0002-000000000002', 'Dus Packaging Bakery',       'PHYSICAL');

-- Verifikasi
SELECT o.name as organization, o.industry_type, COUNT(s.id) as total_services
FROM organizations o
LEFT JOIN agency_services s ON s.organization_id = o.id
GROUP BY o.id, o.name, o.industry_type
ORDER BY o.id;
