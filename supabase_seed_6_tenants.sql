-- ============================================================
-- VYLOGIX CRM — 6 TENANTS SEED & FIXTURE DATA (V3 GRAND UNIFIED)
-- Versi: 3.2 (Digital, Physical & Hybrid Multi-Tenant Demo)
--
-- CARA PENGGUNAAN:
-- 1. Rekomendasi Utama: Jalankan `npm run seed` atau `node scripts/seed_demo_ecosystem.mjs` di terminal
--    (Skrip ini otomatis mendaftarkan auth.users Supabase + Password unik tiap akun + Profil + Order).
-- 2. File SQL ini menyediakan struktur data master 6 Organisasi & Layanan.
-- ============================================================

-- 1. PASTIKAN ROLES & PERMISSIONS TERSEDIA
INSERT INTO roles (slug, name) VALUES 
    ('super_admin', 'Super Admin'),
    ('admin', 'Agency Admin'),
    ('staff_ops', 'Staff Operasional / PM'),
    ('staff_finance', 'Staff Keuangan (Digital)'),
    ('staff_digital', 'Staff Digital (Programmer/Designer)'),
    ('staff_cs', 'Staff Customer Service / Kasir'),
    ('staff_design', 'Staff Desainer Fisik'),
    ('staff_production', 'Tim Mesin & Produksi'),
    ('staff_warehouse', 'Admin Gudang'),
    ('staff_shipping', 'Tim Packing & Kurir'),
    ('client', 'Client')
ON CONFLICT (slug) DO NOTHING;

-- 2. INSERT 6 ORGANISASI (2 Digital, 2 Fisik, 2 Hybrid)
INSERT INTO organizations (id, name, slug, tagline, is_active, industry_type, module_digital, module_physical, monthly_sales_target, created_at) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Digital Studio A', 'digital-studio-a', 'Solusi Rekayasa Digital & Software Kreatif', true, 'DIGITAL', true, false, 40000000, now()),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Digital Studio B', 'digital-studio-b', 'Transformasi UI/UX & Web Development Modern', true, 'DIGITAL', true, false, 35000000, now()),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Print Craft A',    'print-craft-a',    'Spesialis Percetakan Hardbox, Offset & Packaging', true, 'PHYSICAL', false, true, 55000000, now()),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Print Craft B',    'print-craft-b',    'Spesialis Konveksi, Sablon & Digital Textile Printing', true, 'PHYSICAL', false, true, 48000000, now()),
  ('cccccccc-0001-0001-0001-000000000001', 'Hybrid Media A',   'hybrid-media-a',   'Ekosistem Agensi Terpadu: Digital Tech & Creative Printing', true, 'HYBRID', true, true, 75000000, now()),
  ('cccccccc-0002-0002-0002-000000000002', 'Hybrid Media B',   'hybrid-media-b',   'Solusi Digitalisasi UMKM, Cetak & Branding Lengkap', true, 'HYBRID', true, true, 60000000, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  tagline = EXCLUDED.tagline,
  industry_type = EXCLUDED.industry_type,
  module_digital = EXCLUDED.module_digital,
  module_physical = EXCLUDED.module_physical,
  monthly_sales_target = EXCLUDED.monthly_sales_target;

-- 3. INSERT LAYANAN AGENSI (AGENCY SERVICES)
INSERT INTO agency_services (organization_id, name, service_category, service_class) VALUES
  -- Digital Studio A
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Pengembangan Web Portal E-Commerce', 'DIGITAL', 'digital_umum'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'SaaS App Development & API', 'DIGITAL', 'digital_umum'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'UI/UX Redesign & Figma Tokens', 'DIGITAL', 'digital_umum'),
  -- Digital Studio B
  ('aaaaaaaa-0002-0002-0002-000000000002', 'UI/UX Design System & Wireframing', 'DIGITAL', 'digital_umum'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Custom ERP & POS Web System', 'DIGITAL', 'digital_umum'),
  -- Print Craft A
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Cetak Hardbox Custom & Foil Emas', 'PHYSICAL', 'physical_umum'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Stiker Cutting Vinyl & Label Botol', 'PHYSICAL', 'physical_umum'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Buku Menu Restoran Hardcover Baut', 'PHYSICAL', 'physical_umum'),
  -- Print Craft B
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Konveksi Seragam Polo & Bordir', 'PHYSICAL', 'physical_umum'),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Paper Bag Kraft & Dus Kemasan', 'PHYSICAL', 'physical_umum'),
  -- Hybrid Media A
  ('cccccccc-0001-0001-0001-000000000001', 'Website Ticketing & QR Scanner Event', 'DIGITAL', 'digital_umum'),
  ('cccccccc-0001-0001-0001-000000000001', 'Cetak Lanyard ID Card & Merchandise Event', 'PHYSICAL', 'physical_umum'),
  ('cccccccc-0001-0001-0001-000000000001', 'App E-Katalog PWA & Brand Identity', 'DIGITAL', 'digital_umum'),
  ('cccccccc-0001-0001-0001-000000000001', 'Standing Rollup Banner & Brosur Fresh', 'PHYSICAL', 'physical_umum'),
  -- Hybrid Media B
  ('cccccccc-0002-0002-0002-000000000002', 'Platform Donasi Online & Payment Gateway', 'DIGITAL', 'digital_umum'),
  ('cccccccc-0002-0002-0002-000000000002', 'Cetak Kotak Zakat & Brosur Kampanye', 'PHYSICAL', 'physical_umum'),
  ('cccccccc-0002-0002-0002-000000000002', 'Aplikasi QR Menu & Kasir POS Web', 'DIGITAL', 'digital_umum'),
  ('cccccccc-0002-0002-0002-000000000002', 'Box Packaging Roti Foodgrade Custom', 'PHYSICAL', 'physical_umum')
ON CONFLICT DO NOTHING;

-- 4. INSERT MASTER GUDANG & INVENTARIS
INSERT INTO inventory_items (organization_id, name, category, current_stock, unit, min_stock_alert) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Kertas Art Paper 150gr', 'Kertas', 450, 'Rim', 50),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Karton Yellow Board No. 30', 'Bahan Baku Box', 120, 'Lembar', 20),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Stiker Vinyl Glossy Ritrama', 'Stiker', 35, 'Roll', 5),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Kain Lacoste Pique CVC Navy', 'Kain Tekstil', 320, 'Kg', 40),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Kertas Kraft 150gr Cokelat', 'Bahan Baku Paperbag', 500, 'Lembar', 60),
  ('cccccccc-0001-0001-0001-000000000001', 'Kartu PVC RFID 13.56MHz', 'Bahan Kartu', 2200, 'Pcs', 300),
  ('cccccccc-0001-0001-0001-000000000001', 'Tali Lanyard Polos 2cm Hitam', 'Aksesoris Event', 4500, 'Yard', 500),
  ('cccccccc-0002-0002-0002-000000000002', 'Karton Ivory Foodgrade 300gr', 'Kertas Makanan', 800, 'Lembar', 100)
ON CONFLICT DO NOTHING;
