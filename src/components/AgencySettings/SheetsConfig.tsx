'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Table, Save, RefreshCw, Loader2, CheckCircle2, Copy, Package, Truck, Wrench, Boxes, Users, Building2 } from 'lucide-react';

export default function SheetsConfig({ 
  serviceAccountEmail, 
  isPhysical = false,
  isHybrid = false
}: { 
  serviceAccountEmail?: string; 
  isPhysical?: boolean;
  isHybrid?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [adminSheetId, setAdminSheetId] = useState('');
  const [staffSheetId, setStaffSheetId] = useState('');
  const [staffEditAllowed, setStaffEditAllowed] = useState(false);
  const [syncMode, setSyncMode] = useState<'manual' | 'realtime' | 'scheduled'>('manual');
  const [syncIntervalHours, setSyncIntervalHours] = useState<number>(24);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/agency/sheet-config');
      if (res.ok) {
        const data = await res.json();
        data.forEach((config: any) => {
          if (config.sheet_role === 'admin') {
            setAdminSheetId(config.sheet_id);
            if (config.sync_mode) setSyncMode(config.sync_mode);
            if (config.sync_interval_hours) setSyncIntervalHours(config.sync_interval_hours);
          }
          if (config.sheet_role === 'staff') {
            setStaffSheetId(config.sheet_id);
            setStaffEditAllowed(config.staff_edit_allowed);
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetched(true);
    }
  };

  const extractSheetId = (input: string) => {
    try {
      if (input.includes('/d/')) {
        const matches = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
          return matches[1];
        }
      }
    } catch (e) {}
    return input.trim();
  };

  const handleSave = async (role: 'admin' | 'staff') => {
    const sheetId = role === 'admin' ? adminSheetId : staffSheetId;
    if (!sheetId && role === 'admin') {
      toast.error('Admin Sheet ID tidak boleh kosong');
      return;
    }
    if (!sheetId && role === 'staff') {
      return; // Skip if staff sheet is empty
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agency/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_role: role,
          sheet_id: sheetId,
          staff_edit_allowed: role === 'staff' ? staffEditAllowed : false,
          sync_mode: syncMode,
          sync_interval_hours: syncIntervalHours
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Konfigurasi ${role.toUpperCase()} Sheet berhasil disimpan!`);
      } else {
        toast.error(data.error || 'Gagal menyimpan konfigurasi');
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan pada sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: string) => {
    setSyncing(type);
    try {
      const res = await fetch(`/api/export/${type}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Data ${type} berhasil disinkronisasi!`);
      } else {
        toast.error(data.error || `Gagal menyinkronkan data ${type}`);
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan saat sinkronisasi');
    } finally {
      setSyncing(null);
    }
  };

  const handleCopyEmail = () => {
    if (serviceAccountEmail) {
      navigator.clipboard.writeText(serviceAccountEmail);
      toast.success('Email Service Account disalin ke clipboard!');
    }
  };

  if (!isFetched) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-[#2563EB]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-[14px] shrink-0 ${isHybrid ? 'bg-purple-50 text-purple-600' : isPhysical ? 'bg-orange-50 text-orange-600' : 'bg-[#F0FDF4] text-[#16A34A]'}`}>
            <Table size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-extrabold text-lg text-[#111827] font-['Plus_Jakarta_Sans']">
                Google Sheets Integration
              </h2>
              {isHybrid && (
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 font-extrabold text-[9px] uppercase tracking-wider rounded-md">
                  ⚡ Hybrid Mode
                </span>
              )}
            </div>
            <p className="text-[#4B5563] text-xs">
              {isHybrid 
                ? 'Sinkronisasi lengkap 2 divisi: Data Proyek Digital (Domain/Server) & Operasional Fisik (Gudang/Logistik/Resi).'
                : 'Hubungkan database CRM ke Google Spreadsheet secara otomatis & terisolasi aman.'}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-8">
        
        {/* Admin Sheet Config */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full"></div>
              1. Master (Admin) Sheet
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 ml-3.5 leading-relaxed">
              Sheet ini akan menampung seluruh data perusahaan Anda. Anda <strong className="text-[#111827]">wajib membagikan (Share)</strong> file Spreadsheet Anda ke email sistem di bawah ini dengan akses sebagai <strong>Editor</strong>.
            </p>
            {serviceAccountEmail ? (
              <div className="ml-3.5 mt-3 mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-[12px] flex items-center justify-between">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Email Sistem (Service Account)</span>
                  <span className="text-xs font-mono font-medium text-[#111827] truncate">{serviceAccountEmail}</span>
                </div>
                <button 
                  onClick={handleCopyEmail}
                  className="p-2 ml-2 bg-white text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0 shadow-sm"
                  title="Salin Email"
                >
                  <Copy size={14} />
                </button>
              </div>
            ) : (
              <div className="ml-3.5 mt-3 mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-[12px] border border-red-100">
                Email Service Account tidak terdeteksi. Harap hubungi administrator.
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 ml-3.5">
            <div className="flex-1">
              <input 
                type="text" 
                value={adminSheetId} 
                onChange={(e) => setAdminSheetId(extractSheetId(e.target.value))}
                placeholder="Contoh ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
            <button 
              onClick={() => handleSave('admin')} 
              disabled={loading || !adminSheetId}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-[10px] text-xs font-bold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan
            </button>
          </div>
        </div>

        <div className="h-px bg-black/5 w-full"></div>

        {/* Staff Sheet Config */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full"></div>
              2. Staff Sheet <span className="text-[#9CA3AF] font-normal">(Opsional)</span>
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 ml-3.5">
              Sheet terpisah yang hanya menampilkan kolom operasional (cocok untuk staf agar tidak melihat data master/keuangan yang sensitif).
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 ml-3.5">
            <div className="flex-1 space-y-3">
              <input 
                type="text" 
                value={staffSheetId} 
                onChange={(e) => setStaffSheetId(extractSheetId(e.target.value))}
                placeholder="Kosongkan jika tidak butuh sheet terpisah untuk staf"
                className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-black/10 rounded-[10px] text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] transition-all"
              />
              
              <label className="flex items-center gap-2 cursor-pointer group w-max">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={staffEditAllowed}
                    onChange={(e) => setStaffEditAllowed(e.target.checked)}
                    className="w-4 h-4 border-2 border-gray-300 rounded-[4px] text-[#8B5CF6] focus:ring-[#8B5CF6] transition-colors cursor-pointer"
                  />
                </div>
                <span className="text-xs font-medium text-[#4B5563] group-hover:text-[#111827] transition-colors">
                  Izinkan staf menambah baris/catatan manual di Sheet ini
                </span>
              </label>
            </div>
            
            <button 
              onClick={() => handleSave('staff')} 
              disabled={loading || !staffSheetId}
              className="flex items-center justify-center gap-2 px-6 py-2.5 h-[42px] bg-[#F8F9FA] border border-black/10 text-[#4B5563] hover:bg-[#111827] hover:text-white hover:border-[#111827] font-bold rounded-[10px] text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan
            </button>
          </div>
        </div>

        <div className="h-px bg-black/5 w-full"></div>

        {/* Automation Config */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#F43F5E] rounded-full"></div>
              3. Otomatisasi Sinkronisasi
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 ml-3.5">
              Pilih bagaimana dan kapan data CRM diekspor ke Spreadsheet.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 ml-3.5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSyncMode('manual')}
                className={`px-4 py-2 text-xs font-bold rounded-[10px] border transition-all ${syncMode === 'manual' ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white text-[#4B5563] border-black/10 hover:bg-[#F8F9FA]'}`}
              >
                Hanya Manual
              </button>
              <button
                onClick={() => setSyncMode('scheduled')}
                className={`px-4 py-2 text-xs font-bold rounded-[10px] border transition-all ${syncMode === 'scheduled' ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white text-[#4B5563] border-black/10 hover:bg-[#F8F9FA]'}`}
              >
                Otomatis Terjadwal
              </button>
              <button
                onClick={() => setSyncMode('realtime')}
                className={`px-4 py-2 text-xs font-bold rounded-[10px] border transition-all ${syncMode === 'realtime' ? 'bg-[#F43F5E] text-white border-[#F43F5E]' : 'bg-white text-[#4B5563] border-black/10 hover:bg-[#F8F9FA]'}`}
              >
                Realtime (Otomatis Penuh)
              </button>
            </div>
            
            {syncMode === 'scheduled' && (
              <div className="flex items-center gap-2 mt-2 bg-[#F8F9FA] p-3 rounded-[10px] border border-black/5 w-max">
                <span className="text-xs font-medium text-[#4B5563]">Jalankan ekspor otomatis setiap</span>
                <input 
                  type="number"
                  min="1"
                  max="168"
                  value={syncIntervalHours}
                  onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 text-center bg-white border border-black/10 rounded-[6px] text-xs font-bold focus:outline-none focus:border-[#F43F5E]"
                />
                <span className="text-xs font-medium text-[#4B5563]">jam</span>
              </div>
            )}
            
            {syncMode === 'realtime' && (
              <div className="mt-2 bg-rose-50 text-rose-700 p-3 rounded-[10px] border border-rose-100 text-xs font-medium">
                <strong>Catatan:</strong> Mode Realtime memanggil API Google Sheets setiap kali ada data yang berubah. Pastikan akun Service Account kamu aman dari limitasi Google (max 300 request/menit).
              </div>
            )}
            
            {syncMode !== 'manual' && (
              <button 
                onClick={() => handleSave('admin')} 
                disabled={loading || !adminSheetId}
                className="w-max mt-2 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-[10px] text-xs font-bold hover:bg-[#374151] disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan Pengaturan Otomatisasi
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-black/5 w-full"></div>

        {/* Manual Sync */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full"></div>
              Sinkronisasi Manual
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 ml-3.5">
              Kirim data database CRM ke Google Sheets Anda sekarang juga. Setiap agensi hanya mengakses dan mengekspor datanya sendiri.
            </p>
          </div>
          
          <div className="space-y-3 ml-3.5">
            {/* Umum / Core Sync */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => handleSync('projects')} 
                disabled={!!syncing || !adminSheetId}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/10 text-[#4B5563] rounded-[10px] text-xs font-bold hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors disabled:opacity-50 shadow-sm"
              >
                {syncing === 'projects' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Sync Data Proyek / SPK
              </button>
              <button 
                onClick={() => handleSync('finance')} 
                disabled={!!syncing || !adminSheetId}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/10 text-[#4B5563] rounded-[10px] text-xs font-bold hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors disabled:opacity-50 shadow-sm"
              >
                {syncing === 'finance' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Sync Data Keuangan / Invoice
              </button>
              <button 
                onClick={() => handleSync('operations')} 
                disabled={!!syncing || !adminSheetId}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/10 text-[#4B5563] rounded-[10px] text-xs font-bold hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors disabled:opacity-50 shadow-sm"
              >
                {syncing === 'operations' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Sync Data Operasional
              </button>
              <button 
                onClick={() => handleSync('accounts')} 
                disabled={!!syncing || !adminSheetId}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/10 text-[#4B5563] rounded-[10px] text-xs font-bold hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors disabled:opacity-50 shadow-sm"
              >
                {syncing === 'accounts' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Sync Data Akun (Staf & Klien)
              </button>
            </div>

            {/* Khusus Agensi Fisik */}
            {isPhysical && (
              <div className="pt-3 border-t border-black/5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                  <Package size={14} /> Modul Khusus Agensi Fisik & Manufaktur
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handleSync('inventory')} 
                    disabled={!!syncing || !adminSheetId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-[10px] text-xs font-bold hover:bg-orange-100 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {syncing === 'inventory' ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                    Sync Master Stok Gudang
                  </button>
                  <button 
                    onClick={() => handleSync('stock_mutations')} 
                    disabled={!!syncing || !adminSheetId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-[10px] text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {syncing === 'stock_mutations' ? <Loader2 size={14} className="animate-spin" /> : <Boxes size={14} />}
                    Sync Mutasi Bahan (In/Out)
                  </button>
                  <button 
                    onClick={() => handleSync('shipping')} 
                    disabled={!!syncing || !adminSheetId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-[10px] text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {syncing === 'shipping' ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    Sync Logistik & Resi
                  </button>
                  <button 
                    onClick={() => handleSync('maintenance')} 
                    disabled={!!syncing || !adminSheetId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[10px] text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {syncing === 'maintenance' ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                    Sync Laporan Mesin
                  </button>
                  <button 
                    onClick={() => handleSync('suppliers')} 
                    disabled={!!syncing || !adminSheetId}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-[10px] text-xs font-bold hover:bg-purple-100 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {syncing === 'suppliers' ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                    Sync Direktori Pemasok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
