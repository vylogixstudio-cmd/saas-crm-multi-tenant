<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vylogix-deployment-rules -->
# Deployment Reminders (Vylogix CRM)
Jika User meminta bantuan untuk melakukan **Deployment** aplikasi ini ke production (Vercel/VPS), kamu **WAJIB** mengingatkan User tentang hal berikut:

1. **Google Sheets Realtime Webhook:**
   User memiliki fitur integrasi Google Sheets. Untuk mengaktifkan mode *realtime*, kamu harus menyuruh User menjalankan SQL Trigger di Supabase Dashboard mereka dengan mengganti `DOMAIN_ANDA.com` menjadi domain production mereka yang sebenarnya. 
   File referensi SQL-nya ada di: `supabase_schema_sheets_automation.sql`.

2. **Cron Job untuk Scheduled Sync:**
   Jika mendeploy di Vercel, pastikan file `vercel.json` memiliki konfigurasi Cron yang memanggil `/api/cron/sheets-sync` setiap 1 jam, dan ingatkan user untuk mengatur *Environment Variable* `CRON_SECRET`.
<!-- END:vylogix-deployment-rules -->
