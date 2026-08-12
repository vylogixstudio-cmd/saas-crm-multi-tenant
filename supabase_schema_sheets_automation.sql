-- ============================================================
-- SQL MIGRATION FOR GOOGLE SHEETS AUTOMATION (REALTIME WEBHOOK)
--
-- CARA PENGGUNAAN DI SUPABASE:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Pastikan extension pg_net sudah aktif (CREATE EXTENSION IF NOT EXISTS pg_net;)
-- 3. Ganti 'https://DOMAIN_ANDA.vercel.app' dengan domain production asli Anda
-- 4. Jalankan skrip ini (Run).
-- ============================================================

-- Aktifkan ekstensi pg_net untuk kemampuan HTTP request dari Database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fungsi Webhook Trigger: Menembak API Next.js setiap ada perubahan data proyek
CREATE OR REPLACE FUNCTION trigger_sheet_realtime_sync()
RETURNS trigger AS $$
BEGIN
  -- Lakukan HTTP POST ke endpoint Next.js dengan membawa organization_id
  PERFORM net.http_post(
      url:='https://DOMAIN_ANDA.vercel.app/api/webhooks/sheets-realtime',
      body:=json_build_object('agency_id', COALESCE(NEW.organization_id, OLD.organization_id))::jsonb,
      headers:='{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada Tabel 'projects'
DROP TRIGGER IF EXISTS after_projects_change ON projects;
CREATE TRIGGER after_projects_change
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION trigger_sheet_realtime_sync();
