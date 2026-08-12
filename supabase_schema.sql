-- ============================================================
-- VYLOGIX CRM — GRAND UNIFIED SCHEMA V3 (DYNAMIC RBAC)
-- Versi: 3.0 (Plug & Play, Safe for Existing Data)
--
-- CARA PENGGUNAAN:
-- Copy semua kode ini, lalu jalankan di Supabase Dashboard -> SQL Editor.
-- Skrip ini menggabungkan semua tabel (Core, Digital, Physical, Finance, RBAC)
-- menjadi SATU file agar mudah di-deploy ke database baru (PNP).
-- ============================================================

-- ============================================================
-- BAGIAN 0: BERSIH-BERSIH (CLEANUP & SAFE MIGRATION PREP)
-- ============================================================

-- Hapus fungsi lama yang bergantung pada hardcode role
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Hapus check constraint kaku di tabel profiles (jika ada di database lama)
DO $$ 
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;


-- ============================================================
-- BAGIAN 1: TABEL INTI & DYNAMIC RBAC
-- ============================================================

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name                TEXT        NOT NULL,
    slug                TEXT        UNIQUE,
    is_active           BOOLEAN     DEFAULT true,
    auto_suspend        BOOLEAN     DEFAULT false,
    license_expires_at  TIMESTAMPTZ DEFAULT NULL,
    tagline             TEXT        DEFAULT NULL,
    logo_url            TEXT        DEFAULT NULL,
    webhook_url         TEXT        DEFAULT NULL,
    log_retention_days  INTEGER     DEFAULT 30,
    whatsapp_number     TEXT        DEFAULT NULL,
    industry_type       TEXT        DEFAULT 'DIGITAL',
    qris_image_url      TEXT        DEFAULT NULL,
    module_digital      BOOLEAN     DEFAULT true,
    module_physical     BOOLEAN     DEFAULT false,
    custom_asset_categories TEXT[]  DEFAULT ARRAY['Logo & Branding', 'Font & Tipografi', 'Desain Siap Cetak', 'Dokumen & Copywriting', 'Gambar Konten Web/App', 'Lainnya']::TEXT[],
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- (Untuk DB Lama) Memastikan semua kolom ada
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS auto_suspend BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS webhook_url TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS log_retention_days INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'DIGITAL',
    ADD COLUMN IF NOT EXISTS qris_image_url TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS module_digital BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS module_physical BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_asset_categories TEXT[] DEFAULT ARRAY['Logo & Branding', 'Font & Tipografi', 'Desain Siap Cetak', 'Dokumen & Copywriting', 'Gambar Konten Web/App', 'Lainnya']::TEXT[];



-- 2. PROFILES (Users)
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT    NOT NULL,
    full_name       TEXT,
    role            TEXT    DEFAULT 'client',
    organization_id UUID    REFERENCES organizations(id) ON DELETE SET NULL,
    whatsapp_number TEXT    DEFAULT NULL,
    address         TEXT    DEFAULT NULL,
    supplier_goods  TEXT    DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- (Untuk DB Lama)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS supplier_goods TEXT DEFAULT NULL;
UPDATE profiles SET role = 'staff_digital' WHERE role = 'staff_executor';


-- 3. RBAC TABLES (Roles & Permissions)
CREATE TABLE IF NOT EXISTS roles (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    slug TEXT PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_slug TEXT REFERENCES roles(slug) ON DELETE CASCADE,
    permission_slug TEXT REFERENCES permissions(slug) ON DELETE CASCADE,
    PRIMARY KEY (role_slug, permission_slug)
);

-- SEED DATA ROLES
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

-- SEED DATA PERMISSIONS
INSERT INTO permissions (slug, description) VALUES
    ('projects.read', 'Bisa melihat daftar proyek'),
    ('projects.manage', 'Bisa membuat, edit, hapus proyek'),
    ('finance.read', 'Bisa melihat data keuangan & invoice'),
    ('finance.manage', 'Bisa kelola invoice & mutasi transaksi'),
    ('production.read', 'Bisa melihat antrean produksi'),
    ('production.manage', 'Bisa update status produksi fisik'),
    ('warehouse.read', 'Bisa melihat stok gudang'),
    ('warehouse.manage', 'Bisa kelola stok dan barang masuk/keluar'),
    ('packing.read', 'Bisa melihat antrean packing'),
    ('packing.manage', 'Bisa update status packing'),
    ('shipping.read', 'Bisa melihat antrean pengiriman'),
    ('shipping.manage', 'Bisa update resi dan kurir pengiriman'),
    ('digital_tasks.read', 'Bisa melihat task/tugas digital'),
    ('digital_tasks.manage', 'Bisa update progress & upload file digital'),
    ('design.read', 'Bisa melihat antrean desain fisik'),
    ('design.manage', 'Bisa upload hasil desain dan konfirmasi ke produksi')
ON CONFLICT (slug) DO NOTHING;

-- SEED ROLE PERMISSIONS (Menautkan hak akses)
TRUNCATE TABLE role_permissions;
INSERT INTO role_permissions (role_slug, permission_slug) VALUES
    ('admin', 'projects.read'), ('admin', 'projects.manage'),
    ('admin', 'finance.read'), ('admin', 'finance.manage'),
    ('admin', 'production.read'), ('admin', 'production.manage'),
    ('admin', 'warehouse.read'), ('admin', 'warehouse.manage'),
    ('admin', 'packing.read'), ('admin', 'packing.manage'),
    ('admin', 'shipping.read'), ('admin', 'shipping.manage'),
    ('admin', 'digital_tasks.read'), ('admin', 'digital_tasks.manage'),
    ('admin', 'design.read'), ('admin', 'design.manage'),

    ('staff_ops', 'projects.read'), ('staff_ops', 'projects.manage'),
    ('staff_ops', 'production.read'), ('staff_ops', 'packing.read'), 
    ('staff_ops', 'shipping.read'), ('staff_ops', 'digital_tasks.read'),
    ('staff_ops', 'warehouse.read'), ('staff_ops', 'design.read'),

    ('staff_finance', 'finance.read'), ('staff_finance', 'finance.manage'),
    ('staff_digital', 'digital_tasks.read'), ('staff_digital', 'digital_tasks.manage'), ('staff_digital', 'projects.read'),
    
    ('staff_cs', 'finance.read'), ('staff_cs', 'finance.manage'), ('staff_cs', 'projects.read'), ('staff_cs', 'projects.manage'), ('staff_cs', 'warehouse.read'),
    ('staff_design', 'design.read'), ('staff_design', 'design.manage'), ('staff_design', 'projects.read'),
    ('staff_production', 'production.read'), ('staff_production', 'production.manage'),
    ('staff_warehouse', 'warehouse.read'), ('staff_warehouse', 'warehouse.manage'),
    ('staff_shipping', 'packing.read'), ('staff_shipping', 'packing.manage'), ('staff_shipping', 'shipping.read'), ('staff_shipping', 'shipping.manage');


-- ============================================================
-- BAGIAN 2: FUNGSI BANTU (TRIGGER & HELPER)
-- ============================================================

-- Trigger untuk User Baru Auth Supabase -> Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name',
        COALESCE(new.raw_user_meta_data ->> 'role', 'client')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fungsi RLS: Cek Hak Akses Role
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id LIMIT 1;
  IF v_role = 'super_admin' THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role_slug = v_role AND permission_slug = p_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fungsi RLS: Ambil Org ID user saat ini
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- BAGIAN 3: TABEL PROYEK & LAYANAN
-- ============================================================

CREATE TABLE IF NOT EXISTS agency_services (
    id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    service_class   TEXT    DEFAULT 'digital_umum',
    service_category TEXT   DEFAULT 'DIGITAL',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title               TEXT        NOT NULL,
    service_type        TEXT,
    service_class       TEXT        DEFAULT 'digital_umum',
    project_category    TEXT        DEFAULT 'DIGITAL',
    status              TEXT        DEFAULT 'briefing',
    progress_percentage INTEGER     DEFAULT 0,
    deadline            DATE,
    total_price         NUMERIC     DEFAULT 0,
    payment_status      TEXT        DEFAULT 'pending',
    termin_1            NUMERIC     DEFAULT 0,
    termin_2            NUMERIC     DEFAULT 0,
    termin_3            NUMERIC     DEFAULT 0,
    preview_url         TEXT,
    link_youtube        TEXT,
    link_cloudinary     TEXT,
    warranty_months     INTEGER     DEFAULT 0,
    warranty_expired_at DATE,
    domain_name         TEXT,
    domain_expiry_date  DATE,
    hosting_info        TEXT,
    skip_asset_cleanup  BOOLEAN     DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_digital_details (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id          UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    preview_url         TEXT,
    link_youtube        TEXT,
    link_cloudinary     TEXT,
    domain_name         TEXT,
    domain_expiry_date  DATE,
    hosting_info        TEXT,
    warranty_months     INTEGER     DEFAULT 0,
    warranty_expired_at DATE,
    platform            TEXT,
    design_notes        TEXT,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_physical_details (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id          UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    item_type           TEXT,
    quantity            INTEGER     DEFAULT 1,
    material_notes      TEXT,
    size_notes          TEXT,
    color_notes         TEXT,
    design_file_url     TEXT,
    shipping_address    TEXT,
    shipping_courier    TEXT,
    tracking_number     TEXT,
    shipping_status     TEXT        DEFAULT 'WAITING',
    production_deadline DATE,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_assets (
    id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name   TEXT    NOT NULL,
    file_url    TEXT    NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS project_revisions (
    id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    status      TEXT    DEFAULT 'Pending',
    admin_reply TEXT,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_notes (
    id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id      UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id       UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content         TEXT    NOT NULL,
    is_client_message   BOOLEAN DEFAULT false,
    visible_to_client   BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- (Untuk DB Lama) Tambah kolom portal
ALTER TABLE internal_notes ADD COLUMN IF NOT EXISTS is_client_message BOOLEAN DEFAULT false;
ALTER TABLE internal_notes ADD COLUMN IF NOT EXISTS visible_to_client BOOLEAN DEFAULT false;


-- ============================================================
-- BAGIAN 4: TABEL KEUANGAN (POS & KASIR)
-- ============================================================

CREATE TABLE IF NOT EXISTS fin_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WAITING_CONFIRMATION', 'PAID', 'CANCELLED', 'SPLIT_REQUESTED', 'SPLIT_APPROVED')),
    payment_proof_url TEXT,
    cancel_reason   TEXT,
    due_date        DATE,
    termin_label    TEXT,
    split_request_details JSONB,
    parent_invoice_id UUID REFERENCES fin_invoices(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, invoice_number)
);

-- (Untuk DB Lama / Safe Patching)
ALTER TABLE fin_invoices DROP CONSTRAINT IF EXISTS fin_invoices_status_check;
ALTER TABLE fin_invoices ADD CONSTRAINT fin_invoices_status_check CHECK (status IN ('PENDING', 'WAITING_CONFIRMATION', 'PAID', 'CANCELLED', 'SPLIT_REQUESTED', 'SPLIT_APPROVED'));
ALTER TABLE fin_invoices
    ADD COLUMN IF NOT EXISTS termin_label TEXT,
    ADD COLUMN IF NOT EXISTS split_request_details JSONB,
    ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES fin_invoices(id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS fin_invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES fin_invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price NUMERIC DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fin_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount NUMERIC DEFAULT 0 NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- BAGIAN 5: AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id        UUID,
    actor_email     TEXT,
    action          TEXT        NOT NULL,
    target_type     TEXT,
    target_id       TEXT,
    target_name     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ============================================================
-- BAGIAN 6: ROW LEVEL SECURITY (RLS) POLICIES BARU
-- ============================================================

-- Aktifkan RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_digital_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_physical_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 RBAC & Organisasi
DROP POLICY IF EXISTS "Public Read Roles" ON roles;
CREATE POLICY "Public Read Roles" ON roles FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Public Read Permissions" ON permissions;
CREATE POLICY "Public Read Permissions" ON permissions FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Public Read RolePermissions" ON role_permissions;
CREATE POLICY "Public Read RolePermissions" ON role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "User lihat profil sendiri" ON profiles;
CREATE POLICY "User lihat profil sendiri" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "User update profil sendiri" ON profiles;
CREATE POLICY "User update profil sendiri" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Staff bisa lihat profil rekan se-agensi" ON profiles;
CREATE POLICY "Staff bisa lihat profil rekan se-agensi" ON profiles FOR SELECT USING (organization_id = public.get_my_org_id());

DROP POLICY IF EXISTS "Staff lihat agensi sendiri" ON organizations;
CREATE POLICY "Staff lihat agensi sendiri" ON organizations FOR SELECT USING (id = public.get_my_org_id());

-- 6.2 Projects & Details
DROP POLICY IF EXISTS "Staff (baca) bisa lihat project agensi" ON projects;
CREATE POLICY "Staff (baca) bisa lihat project agensi" ON projects
    FOR SELECT USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'projects.read'));
DROP POLICY IF EXISTS "Staff (manage) bisa update project agensi" ON projects;
CREATE POLICY "Staff (manage) bisa update project agensi" ON projects
    FOR ALL USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'projects.manage'));
DROP POLICY IF EXISTS "Client lihat project sendiri" ON projects;
CREATE POLICY "Client lihat project sendiri" ON projects
    FOR SELECT USING (client_id = auth.uid());

-- (Policy serupa diterapkan untuk tabel turunan projects seperti digital_details, physical_details.
-- Kita sederhanakan dengan bypass yang terhubung ke Project Policy di atas)
DROP POLICY IF EXISTS "Akses Digital Details" ON project_digital_details;
CREATE POLICY "Akses Digital Details" ON project_digital_details
    FOR ALL USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.organization_id = public.get_my_org_id() OR p.client_id = auth.uid())));
DROP POLICY IF EXISTS "Akses Physical Details" ON project_physical_details;
CREATE POLICY "Akses Physical Details" ON project_physical_details
    FOR ALL USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.organization_id = public.get_my_org_id() OR p.client_id = auth.uid())));

-- 6.3 Finance
DROP POLICY IF EXISTS "Staff (baca) lihat finance" ON fin_invoices;
CREATE POLICY "Staff (baca) lihat finance" ON fin_invoices
    FOR SELECT USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'finance.read'));
DROP POLICY IF EXISTS "Staff (manage) kelola finance" ON fin_invoices;
CREATE POLICY "Staff (manage) kelola finance" ON fin_invoices
    FOR ALL USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'finance.manage'));
DROP POLICY IF EXISTS "Client lihat invoice miliknya" ON fin_invoices;
CREATE POLICY "Client lihat invoice miliknya" ON fin_invoices
    FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Staff (baca) lihat transaksi" ON fin_transactions;
CREATE POLICY "Staff (baca) lihat transaksi" ON fin_transactions
    FOR SELECT USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'finance.read'));
DROP POLICY IF EXISTS "Staff (manage) kelola transaksi" ON fin_transactions;
CREATE POLICY "Staff (manage) kelola transaksi" ON fin_transactions
    FOR ALL USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'finance.manage'));

-- ============================================================
-- SELESAI. Vylogix V3 Ready.
-- ============================================================
-- ============================================================
-- SQL MIGRATION FOR GOOGLE SHEETS INTEGRATION (DYNAMIC PER-AGENCY)
-- ============================================================

-- 1. Create table for storing sheet configurations
CREATE TABLE IF NOT EXISTS agency_sheet_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sheet_role TEXT NOT NULL CHECK (sheet_role IN ('admin','staff')),
    sheet_id TEXT NOT NULL,
    tab_projects TEXT DEFAULT 'Projects',
    tab_finance TEXT DEFAULT 'Finance',
    tab_operations TEXT DEFAULT 'Operations',
    staff_edit_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (agency_id, sheet_role)
);

-- 2. Add RLS Policies
ALTER TABLE agency_sheet_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view their agency sheet configs" ON agency_sheet_configs;
CREATE POLICY "Admin can view their agency sheet configs" ON agency_sheet_configs
    FOR SELECT USING (
        agency_id = public.get_my_org_id() 
        AND public.has_permission(auth.uid(), 'sheets.configure')
    );

DROP POLICY IF EXISTS "Admin can insert their agency sheet configs" ON agency_sheet_configs;
CREATE POLICY "Admin can insert their agency sheet configs" ON agency_sheet_configs
    FOR INSERT WITH CHECK (
        agency_id = public.get_my_org_id() 
        AND public.has_permission(auth.uid(), 'sheets.configure')
    );

DROP POLICY IF EXISTS "Admin can update their agency sheet configs" ON agency_sheet_configs;
CREATE POLICY "Admin can update their agency sheet configs" ON agency_sheet_configs
    FOR UPDATE USING (
        agency_id = public.get_my_org_id() 
        AND public.has_permission(auth.uid(), 'sheets.configure')
    );

DROP POLICY IF EXISTS "Admin can delete their agency sheet configs" ON agency_sheet_configs;
CREATE POLICY "Admin can delete their agency sheet configs" ON agency_sheet_configs
    FOR DELETE USING (
        agency_id = public.get_my_org_id() 
        AND public.has_permission(auth.uid(), 'sheets.configure')
    );

-- Also allow system/backend to bypass RLS for cron jobs via Service Role Key (automatic).

-- 3. Add new permissions
INSERT INTO permissions (slug, description) VALUES
    ('sheets.configure', 'Bisa mengatur integrasi Google Sheets (Admin)'),
    ('sheets.export', 'Bisa melakukan ekspor manual ke Google Sheets')
ON CONFLICT (slug) DO NOTHING;

-- 4. Assign new permissions to admin role
INSERT INTO role_permissions (role_slug, permission_slug) VALUES
    ('admin', 'sheets.configure'),
    ('admin', 'sheets.export')
ON CONFLICT DO NOTHING;


-- ============================================================
-- SQL MIGRATION: Vylogix Inventory Management (Fase 2)
-- Eksekusi file ini di SQL Editor Supabase Anda.
-- ============================================================

-- 1. TABEL MASTER BARANG (INVENTORY ITEMS)
CREATE TABLE IF NOT EXISTS inventory_items (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    category            TEXT        DEFAULT 'Umum',
    current_stock       NUMERIC     DEFAULT 0 NOT NULL,
    unit                TEXT        DEFAULT 'Pcs',
    min_stock_alert     NUMERIC     DEFAULT 5,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABEL RIWAYAT MUTASI STOK (INVENTORY TRANSACTIONS)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id             UUID        NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    organization_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type                TEXT        NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
    quantity            NUMERIC     NOT NULL,
    notes               TEXT,
    actor_id            UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name          TEXT,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES UNTUK INVENTORY_ITEMS
DROP POLICY IF EXISTS "Staff bisa melihat stok gudang agensinya" ON inventory_items;
CREATE POLICY "Staff bisa melihat stok gudang agensinya" ON inventory_items
    FOR SELECT USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'warehouse.read'));

DROP POLICY IF EXISTS "Staff bisa mengelola stok gudang agensinya" ON inventory_items;
CREATE POLICY "Staff bisa mengelola stok gudang agensinya" ON inventory_items
    FOR ALL USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'warehouse.manage'));

-- 5. RLS POLICIES UNTUK INVENTORY_TRANSACTIONS
DROP POLICY IF EXISTS "Staff bisa melihat riwayat mutasi agensinya" ON inventory_transactions;
CREATE POLICY "Staff bisa melihat riwayat mutasi agensinya" ON inventory_transactions
    FOR SELECT USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'warehouse.read'));

DROP POLICY IF EXISTS "Staff bisa mencatat mutasi agensinya" ON inventory_transactions;
CREATE POLICY "Staff bisa mencatat mutasi agensinya" ON inventory_transactions
    FOR ALL USING (organization_id = public.get_my_org_id() AND public.has_permission(auth.uid(), 'warehouse.manage'));

-- ============================================================
-- SELESAI. Modul Gudang / Manajemen Stok Siap Digunakan.
-- ============================================================

-- ============================================================
-- BAGIAN X: MAINTENANCE TICKETS (KENDALA MESIN)
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id     UUID        REFERENCES organizations(id) ON DELETE CASCADE,
    machine_name        TEXT        NOT NULL,
    issue_description   TEXT        NOT NULL,
    priority            TEXT        DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status              TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    reported_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read maintenance tickets in their org"
ON maintenance_tickets FOR SELECT
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert maintenance tickets in their org"
ON maintenance_tickets FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Ops can update maintenance tickets"
ON maintenance_tickets FOR UPDATE
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'staff_ops');

-- ============================================================
-- SQL MIGRATION FOR GOOGLE SHEETS AUTOMATION (REALTIME & SCHEDULED)
-- ============================================================

-- 1. Add automation columns to agency_sheet_configs
ALTER TABLE agency_sheet_configs
ADD COLUMN IF NOT EXISTS sync_mode TEXT DEFAULT 'manual' CHECK (sync_mode IN ('manual', 'realtime', 'scheduled')),
ADD COLUMN IF NOT EXISTS sync_interval_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 2. Create Webhook Trigger for Projects (Realtime)
-- We assume Vylogix project table is named 'projects'
-- Replace 'https://your-domain.com/api/webhooks/sheets-realtime' with your actual production domain
-- In local development, you can use ngrok to expose your localhost to Supabase

/*
-- UNCOMMENT AND RUN THIS IF YOU WANT TO SETUP REALTIME DB WEBHOOK
-- You must enable pg_net extension first in Supabase:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_sheet_realtime_sync()
RETURNS trigger AS $$
BEGIN
  -- We use pg_net to make an HTTP POST request to our Next.js API
  -- We pass the agency_id so the API knows which agency's sheet to update
  PERFORM net.http_post(
      url:='https://your-domain.com/api/webhooks/sheets-realtime',
      body:=json_build_object('agency_id', COALESCE(NEW.organization_id, OLD.organization_id))::jsonb,
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_TOKEN"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Projects
DROP TRIGGER IF EXISTS after_projects_change ON projects;
CREATE TRIGGER after_projects_change
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION trigger_sheet_realtime_sync();
*/

