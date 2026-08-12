import { ShieldAlert, Phone, Mail, HelpCircle, RefreshCw } from 'lucide-react'
import { getSystemSettings } from '@/lib/superAdminStore'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const settings = getSystemSettings()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Sleek background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        
        {/* Animated Icon Container */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/20 rounded-[32px] blur-xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-slate-900 border border-rose-500/30 rounded-[28px] text-rose-400 shadow-inner animate-bounce">
              <ShieldAlert size={48} />
            </div>
          </div>
        </div>

        {/* Platform Name & Main Header */}
        <div>
          <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-full">
            Platform Maintenance Mode
          </span>
          <h1 className="text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight mt-3 text-white">
            {settings.platform_name || 'Vylogix SaaS CRM'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Kami sedang melakukan peningkatan sistem demi kenyamanan Anda.
          </p>
        </div>

        {/* Custom Maintenance Message Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[24px] shadow-sm text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pesan Pemeliharaan:</p>
          <p className="text-sm text-gray-200 leading-relaxed font-medium">
            {settings.maintenance_message || 'Platform sedang dalam peningkatan performa rutin. Silakan coba kembali beberapa saat lagi.'}
          </p>
        </div>

        {/* Action / Refresh & Support contact buttons */}
        <div className="space-y-4">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-white text-slate-950 hover:bg-gray-100 py-3 rounded-[14px] transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={16} />
            Coba Muat Ulang Halaman
          </a>

          <div className="grid grid-cols-2 gap-3">
            {settings.support_whatsapp && (
              <a
                href={`https://wa.me/${settings.support_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-[12px] transition-all"
              >
                <Phone size={14} className="text-emerald-500" />
                WhatsApp
              </a>
            )}
            {settings.support_email && (
              <a
                href={`mailto:${settings.support_email}`}
                className="flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-[12px] transition-all"
              >
                <Mail size={14} className="text-blue-400" />
                Email Support
              </a>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-600">
          Vylogix CRM Multi-Tenant System &bull; © {new Date().getFullYear()} All rights reserved.
        </p>

      </div>
    </div>
  )
}
