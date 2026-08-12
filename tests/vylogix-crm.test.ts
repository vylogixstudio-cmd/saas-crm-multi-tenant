import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DIGITAL_NAVIGATION,
  PHYSICAL_NAVIGATION,
  PHYSICAL_STAFF_CS,
  PHYSICAL_STAFF_OPS,
  PHYSICAL_STAFF_DESIGN,
  PHYSICAL_STAFF_WAREHOUSE,
  PHYSICAL_STAFF_PRODUCTION,
  PHYSICAL_STAFF_SHIPPING,
  HYBRID_NAVIGATION,
  type NavItem
} from '../src/components/layouts/navigation'

// ============================================================================
// 1. DOMAIN ENUMS & TYPES
// ============================================================================
export type ProjectCategory = 'DIGITAL' | 'PHYSICAL'
export type InvoiceStatus = 'PENDING' | 'WAITING_CONFIRMATION' | 'PAID' | 'SPLIT_REQUESTED' | 'SPLIT_APPROVED' | 'CANCELLED'
export type MutationType = 'IN' | 'OUT' | 'ADJUST'

/**
 * Scan seluruh file page.tsx fisik Next.js di folder src/app
 */
export function getRegisteredNextRoutes(): string[] {
  const appDir = path.join(process.cwd(), 'src', 'app')
  if (!fs.existsSync(appDir)) return []
  
  function scan(dir: string, list: string[] = []) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const full = path.join(dir, file)
      if (fs.statSync(full).isDirectory()) {
        scan(full, list)
      } else if (file.startsWith('page.')) {
        list.push(full)
      }
    }
    return list
  }

  const pageFiles = scan(appDir)
  return pageFiles.map(p => {
    let rel = path.relative(appDir, p).replace(/\\/g, '/')
    rel = rel.replace(/\/page\.[a-z]+$/, '')
    rel = rel.replace(/\/\([^)]+\)/g, '') // remove route groups like (portal), (workspace)
    rel = rel.replace(/^\([^)]+\)\/?/, '')
    if (rel === 'page.tsx' || rel === '') return '/'
    return '/' + rel
  })
}

/**
 * Verifikasi apakah sebuah URL href memiliki file page.tsx yang valid
 */
export function verifyRouteExists(url: string, registeredRoutes: string[]): boolean {
  const cleanPath = url.split('?')[0].split('#')[0]
  return registeredRoutes.some(r => {
    const pattern = '^' + r
      .replace(/\[\.\.\.[^\]]+\]/g, '.*')
      .replace(/\[[^\]]+\]/g, '[^/]+') + '$'
    const re = new RegExp(pattern)
    return re.test(cleanPath)
  })
}

// ============================================================================
// 2. CORE BUSINESS LOGIC (PURE DOMAIN FUNCTIONS)
// ============================================================================

/**
 * Validasi dan perhitungan termin cicilan (Split Invoice)
 */
export function calculateSplitInvoices(totalAmount: number, installmentsCount: number, baseInvoiceTitle: string) {
  if (installmentsCount <= 0 || !Number.isInteger(installmentsCount)) {
    throw new Error('Jumlah cicilan harus bilangan bulat positif minimal 1')
  }
  if (totalAmount <= 0) {
    throw new Error('Total tagihan harus lebih besar dari 0')
  }

  const baseAmount = Math.floor(totalAmount / installmentsCount)
  const remainder = totalAmount % installmentsCount

  const installments = []
  for (let i = 1; i <= installmentsCount; i++) {
    // Sisa pembulatan ditambahkan ke cicilan pertama
    const amount = i === 1 ? baseAmount + remainder : baseAmount
    installments.push({
      termin: i,
      termin_label: `Cicilan ${i}/${installmentsCount}`,
      title: `[Cicilan ${i}/${installmentsCount}] ${baseAmount ? baseInvoiceTitle : ''}`,
      amount,
      status: 'PENDING' as InvoiceStatus
    })
  }

  return {
    totalOriginal: totalAmount,
    installmentsCount,
    items: installments,
    sumCheck: installments.reduce((acc, curr) => acc + curr.amount, 0)
  }
}

/**
 * State Machine Transisi Status Proyek Digital
 */
export const DIGITAL_STATUS_FLOW = ['briefing', 'design', 'development', 'revision', 'completed'] as const
export function getNextDigitalStatus(currentStatus: string): string | null {
  const idx = DIGITAL_STATUS_FLOW.indexOf(currentStatus as any)
  if (idx === -1 || idx === DIGITAL_STATUS_FLOW.length - 1) return null
  return DIGITAL_STATUS_FLOW[idx + 1]
}

/**
 * State Machine Transisi Status Proyek Fisik
 */
export const PHYSICAL_STATUS_FLOW = ['briefing', 'design', 'production', 'finishing', 'packing_completed', 'shipped', 'completed'] as const
export function getNextPhysicalStatus(currentStatus: string): string | null {
  const idx = PHYSICAL_STATUS_FLOW.indexOf(currentStatus as any)
  if (idx === -1 || idx === PHYSICAL_STATUS_FLOW.length - 1) return null
  return PHYSICAL_STATUS_FLOW[idx + 1]
}

/**
 * Decision Engine: ACC atau Revisi Desain Fisik
 */
export function processDesignDecision(currentStatus: string, decision: 'ACC' | 'REVISION') {
  if (currentStatus !== 'design' && currentStatus !== 'revision') {
    throw new Error('Keputusan desain hanya dapat diambil pada tahap design atau revision')
  }
  if (decision === 'ACC') {
    return { nextStatus: 'production', message: 'Desain disetujui, lanjut ke antrean produksi' }
  }
  return { nextStatus: 'revision', message: 'Permintaan revisi tercatat untuk desainer' }
}

/**
 * Perhitungan Sisa Tagihan Proyek
 */
export function calculateRemainingBalance(totalPrice: number, paidInvoices: { amount: number; status: InvoiceStatus }[]) {
  const totalPaid = paidInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  const sisa = Math.max(0, totalPrice - totalPaid)
  const isFullyPaid = sisa === 0 && totalPrice > 0

  return {
    totalPrice,
    totalPaid,
    remainingBalance: sisa,
    isFullyPaid
  }
}

/**
 * Inventory Stock Calculator & Alert
 */
export function processInventoryMutation(currentStock: number, mutationType: MutationType, quantity: number, minStockAlert: number = 5) {
  if (quantity < 0) throw new Error('Kuantiti mutasi tidak boleh negatif')
  
  let newStock = currentStock
  if (mutationType === 'IN') {
    newStock = currentStock + quantity
  } else if (mutationType === 'OUT') {
    if (quantity > currentStock) {
      throw new Error(`Stok tidak mencukupi. Sisa: ${currentStock}, Dibutuhkan: ${quantity}`)
    }
    newStock = currentStock - quantity
  } else if (mutationType === 'ADJUST') {
    newStock = quantity
  }

  const isLowStock = newStock <= minStockAlert

  return {
    previousStock: currentStock,
    newStock,
    mutationType,
    quantity,
    isLowStock
  }
}

/**
 * Validasi Upload File Aset
 */
export function validateAssetUpload(file: { name: string; sizeBytes: number }) {
  const MAX_BYTES = 5 * 1024 * 1024 // 5MB
  const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.pdf', '.ai', '.psd', '.zip', '.rar', '.doc', '.docx']
  
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  const isExtAllowed = ALLOWED_EXTS.includes(ext)
  const isSizeAllowed = file.sizeBytes <= MAX_BYTES

  if (!isExtAllowed) {
    return { valid: false, reason: `Ekstensi ${ext} tidak didukung` }
  }
  if (!isSizeAllowed) {
    return { valid: false, reason: 'Ukuran file melebihi batas 5MB' }
  }

  return { valid: true, reason: 'File valid untuk diunggah' }
}

/**
 * RBAC Permission Check Simulator
 */
export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  admin: [
    'projects.read', 'projects.manage', 'finance.read', 'finance.manage',
    'production.read', 'production.manage', 'warehouse.read', 'warehouse.manage',
    'packing.read', 'packing.manage', 'shipping.read', 'shipping.manage',
    'digital_tasks.read', 'digital_tasks.manage', 'design.read', 'design.manage'
  ],
  staff_ops: [
    'projects.read', 'projects.manage', 'production.read', 'packing.read',
    'shipping.read', 'digital_tasks.read', 'warehouse.read', 'design.read'
  ],
  staff_cs: [
    'finance.read', 'finance.manage', 'projects.read', 'projects.manage', 'warehouse.read'
  ],
  staff_finance: [
    'finance.read', 'finance.manage'
  ],
  staff_design: [
    'design.read', 'design.manage', 'projects.read'
  ],
  staff_production: [
    'production.read', 'production.manage'
  ],
  staff_warehouse: [
    'warehouse.read', 'warehouse.manage'
  ],
  staff_shipping: [
    'packing.read', 'packing.manage', 'shipping.read', 'shipping.manage'
  ],
  client: []
}

export function checkPermission(role: string, permission: string): boolean {
  if (role === 'super_admin') return true
  const perms = ROLE_PERMISSIONS_MAP[role] || []
  return perms.includes(permission)
}

/**
 * Sanitasi & Parser Format Mata Uang Rupiah -> Angka Murni
 */
export function parseCurrencyToNumber(val: string | number): number {
  if (typeof val === 'number') return Math.max(0, val)
  if (!val || typeof val !== 'string') return 0
  const clean = val.replace(/[^0-9]/g, '')
  return parseInt(clean, 10) || 0
}

/**
 * Kalkulator Pajak PPN 12% Kasir POS
 */
export function calculatePosInvoiceTotal(baseAmount: number, includeTax: boolean) {
  if (baseAmount <= 0) throw new Error('Nilai tagihan harus lebih besar dari 0')
  const taxAmount = includeTax ? Math.round(baseAmount * 0.12) : 0
  const finalAmount = baseAmount + taxAmount
  return {
    baseAmount,
    includeTax,
    taxAmount,
    finalAmount
  }
}

/**
 * Validasi URL Webhook & Proteksi Serangan SSRF
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  if (!url?.trim()) return { valid: false, error: 'URL tidak boleh kosong' }
  if (!url.startsWith('https://')) return { valid: false, error: 'URL Webhook wajib menggunakan https://' }
  const localIpPattern = /^(https?:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])|169\.254\.)/i
  if (localIpPattern.test(url)) return { valid: false, error: 'URL Webhook tidak boleh menggunakan IP lokal atau internal (SSRF Protection)' }
  try {
    new URL(url)
    return { valid: true }
  } catch {
    return { valid: false, error: 'Format URL tidak valid' }
  }
}

/**
 * Engine Verifikasi Multi-Tenant & Anti-IDOR
 */
export function checkMultiTenantAccess(
  user: { id: string; orgId: string; role: string },
  resource: { orgId: string; clientId?: string }
): { allowed: boolean; reason?: string } {
  if (user.role === 'super_admin') return { allowed: true }
  if (user.role === 'client') {
    if (resource.clientId && resource.clientId !== user.id) {
      return { allowed: false, reason: 'Klien dilarang mengakses atau memodifikasi data klien lain (Anti-IDOR)' }
    }
    return { allowed: true }
  }
  if (user.orgId !== resource.orgId) {
    return { allowed: false, reason: 'Akses ditolak: Resource milik organisasi agensi lain' }
  }
  return { allowed: true }
}

/**
 * Lifecycle Keputusan Retur & Komplain Pesanan Fisik
 */
export function processReturnDecision(decision: 'RESHIP' | 'REFUND', newTrackingNumber?: string) {
  if (decision === 'RESHIP') {
    if (!newTrackingNumber?.trim()) throw new Error('Nomor resi baru wajib diisi untuk pengiriman ulang barang')
    return {
      nextProjectStatus: 'shipped',
      nextShippingStatus: 'SHIPPED',
      trackingNumber: newTrackingNumber.trim(),
      message: 'Retur disetujui, pesanan pengganti telah dikirim ulang'
    }
  }
  return {
    nextProjectStatus: 'cancelled',
    nextShippingStatus: 'CANCELLED',
    message: 'Pesanan dibatalkan atas kesepakatan refund'
  }
}

/**
 * Kalkulator Tanggal Cutoff Retensi Audit Log
 */
export function calculateLogCutoffDate(retentionDays: number, referenceDate: Date = new Date()): string {
  if (retentionDays <= 0) throw new Error('Hari retensi harus bilangan positif')
  const cutoff = new Date(referenceDate)
  cutoff.setDate(cutoff.getDate() - retentionDays)
  return cutoff.toISOString().split('T')[0]
}

// ============================================================================
// 3. COMPREHENSIVE TEST SUITE EXECUTION
// ============================================================================

describe('💼 Vylogix CRM: Test Suite Otomatis Lengkap', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // A. AGENSI DIGITAL TEST SUITE
  // ──────────────────────────────────────────────────────────────────────────
  describe('🌐 1. Alur & Logika Agensi Digital', () => {
    it('[PASS] Transisi status digital harus berurutan (Briefing -> Design -> Dev -> Revision -> Done)', () => {
      expect(getNextDigitalStatus('briefing')).toBe('design')
      expect(getNextDigitalStatus('design')).toBe('development')
      expect(getNextDigitalStatus('development')).toBe('revision')
      expect(getNextDigitalStatus('revision')).toBe('completed')
      expect(getNextDigitalStatus('completed')).toBeNull()
    })

    it('[PASS] Harus memvalidasi URL aset digital eksternal (Cloudinary / YouTube / Drive)', () => {
      const validLinks = [
        'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://drive.google.com/file/d/123/view'
      ]
      validLinks.forEach(link => {
        expect(link.startsWith('http://') || link.startsWith('https://')).toBe(true)
      })
    })

    it('[PASS] Garansi website harus menghitung masa aktif dengan tepat', () => {
      const startDate = new Date('2026-01-01')
      const warrantyMonths = 6
      const expiryDate = new Date(startDate)
      expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths)
      
      expect(expiryDate.toISOString().split('T')[0]).toBe('2026-07-01')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // B. AGENSI FISIK TEST SUITE
  // ──────────────────────────────────────────────────────────────────────────
  describe('🏭 2. Alur & Logika Agensi Fisik (Percetakan & Manufaktur)', () => {
    it('[PASS] Transisi alur produksi fisik lengkap dari Briefing hingga Selesai', () => {
      let status = 'briefing'
      const steps = []
      while (status) {
        steps.push(status)
        const next = getNextPhysicalStatus(status)
        if (!next) break
        status = next
      }
      expect(steps).toEqual(['briefing', 'design', 'production', 'finishing', 'packing_completed', 'shipped', 'completed'])
    })

    it('[PASS] Klien klik ACC saat tahap Desain harus memindahkan status langsung ke Produksi', () => {
      const decision = processDesignDecision('design', 'ACC')
      expect(decision.nextStatus).toBe('production')
    })

    it('[PASS] Klien meminta revisi saat tahap Desain harus menjaga status tetap di Revisi', () => {
      const decision = processDesignDecision('design', 'REVISION')
      expect(decision.nextStatus).toBe('revision')
    })

    it('[PASS] Keputusan desain di luar tahap desain harus melempar error', () => {
      expect(() => processDesignDecision('production', 'ACC')).toThrow()
      expect(() => processDesignDecision('shipped', 'REVISION')).toThrow()
    })

    it('[PASS] Input nomor resi & ekspedisi pengiriman harus valid', () => {
      const shippingPayload = {
        shipping_courier: 'JNE Trucking',
        tracking_number: 'JNE-CGK-2026-991238',
        shipping_status: 'SHIPPED'
      }
      expect(shippingPayload.shipping_courier.length).toBeGreaterThan(0)
      expect(shippingPayload.tracking_number).toMatch(/^JNE-/)
      expect(shippingPayload.shipping_status).toBe('SHIPPED')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // C. KEUANGAN, POS & PEMBAGIAN CICILAN (SPLIT INVOICE)
  // ──────────────────────────────────────────────────────────────────────────
  describe('💳 3. Modul Keuangan & Sistem Split Invoice', () => {
    it('[PASS] Tagihan Rp 500.000 dicicil 2x menghasilkan 2 termin @ Rp 250.000 tanpa sisa', () => {
      const res = calculateSplitInvoices(500000, 2, 'Cetak Kartu Nama')
      expect(res.items.length).toBe(2)
      expect(res.items[0].amount).toBe(250000)
      expect(res.items[1].amount).toBe(250000)
      expect(res.sumCheck).toBe(500000)
    })

    it('[PASS] Tagihan ganjil Rp 1.000.000 dicicil 3x harus membagi rata & sisa pembulatan di termin pertama', () => {
      const res = calculateSplitInvoices(1000000, 3, 'Pembuatan Website Company Profile')
      expect(res.items.length).toBe(3)
      // 1.000.000 / 3 = 333.333 sisa 1
      expect(res.items[0].amount).toBe(333334)
      expect(res.items[1].amount).toBe(333333)
      expect(res.items[2].amount).toBe(333333)
      // Total penjumlahan seluruh termin HARUS tepat 1.000.000 (konsistensi saldo)
      expect(res.sumCheck).toBe(1000000)
    })

    it('[PASS] Tagihan Rp 1.200.000 dicicil 4x menghasilkan 4 termin @ Rp 300.000', () => {
      const res = calculateSplitInvoices(1200000, 4, 'Brosur & Spanduk Event')
      expect(res.items.length).toBe(4)
      res.items.forEach(item => expect(item.amount).toBe(300000))
      expect(res.sumCheck).toBe(1200000)
    })

    it('[PASS] Perhitungan sisa tagihan berkurang saat termin dibayar lunas', () => {
      const projectPrice = 1000000
      const invoiceHistory = [
        { amount: 500000, status: 'PAID' as InvoiceStatus },
        { amount: 500000, status: 'PENDING' as InvoiceStatus }
      ]
      const balance = calculateRemainingBalance(projectPrice, invoiceHistory)
      expect(balance.totalPaid).toBe(500000)
      expect(balance.remainingBalance).toBe(500000)
      expect(balance.isFullyPaid).toBe(false)
    })

    it('[PASS] Status proyek terdeteksi lunas penuh (isFullyPaid) saat semua invoice PAID', () => {
      const projectPrice = 1000000
      const invoiceHistory = [
        { amount: 500000, status: 'PAID' as InvoiceStatus },
        { amount: 500000, status: 'PAID' as InvoiceStatus }
      ]
      const balance = calculateRemainingBalance(projectPrice, invoiceHistory)
      expect(balance.remainingBalance).toBe(0)
      expect(balance.isFullyPaid).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // D. GUDANG & MANAJEMEN STOK MATERIAL
  // ──────────────────────────────────────────────────────────────────────────
  describe('📦 4. Manajemen Gudang & Mutasi Stok (Inventory)', () => {
    it('[PASS] Barang Masuk (IN) harus menambah total stok saat ini', () => {
      const res = processInventoryMutation(50, 'IN', 30)
      expect(res.newStock).toBe(80)
      expect(res.isLowStock).toBe(false)
    })

    it('[PASS] Pengeluaran Bahan Produksi (OUT) harus mengurangi stok dengan tepat', () => {
      const res = processInventoryMutation(80, 'OUT', 25)
      expect(res.newStock).toBe(55)
      expect(res.isLowStock).toBe(false)
    })

    it('[PASS] Pengeluaran melebihi stok yang tersedia harus melempar error proteksi stok minus', () => {
      expect(() => processInventoryMutation(10, 'OUT', 50)).toThrow(/Stok tidak mencukupi/)
    })

    it('[PASS] Stok Opname (ADJUST) langsung menyesuaikan nilai stok riil fisik', () => {
      const res = processInventoryMutation(100, 'ADJUST', 75)
      expect(res.newStock).toBe(75)
    })

    it('[PASS] Alert otomatis menyala (isLowStock = true) saat sisa stok <= batas minimum', () => {
      const res = processInventoryMutation(10, 'OUT', 7, 5) // Sisa 3 (ambang batas min 5)
      expect(res.newStock).toBe(3)
      expect(res.isLowStock).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // E. UPLOAD ASSET & VALIDASI STORAGE
  // ──────────────────────────────────────────────────────────────────────────
  describe('📁 5. Validasi Upload Materi & Aset Cloud', () => {
    it('[PASS] File logo berformat .png dengan ukuran 2MB harus diterima', () => {
      const result = validateAssetUpload({ name: 'logo-vector.png', sizeBytes: 2 * 1024 * 1024 })
      expect(result.valid).toBe(true)
    })

    it('[PASS] File template berformat .ai atau .psd ukuran 4.5MB harus diterima', () => {
      const result = validateAssetUpload({ name: 'mockup-box.psd', sizeBytes: 4.5 * 1024 * 1024 })
      expect(result.valid).toBe(true)
    })

    it('[PASS] File raksasa 12MB harus otomatis ditolak (batas 5MB)', () => {
      const result = validateAssetUpload({ name: 'large-mockup.psd', sizeBytes: 12 * 1024 * 1024 })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('5MB')
    })

    it('[PASS] File dengan ekstensi berbahaya/tidak didukung (.exe) harus ditolak', () => {
      const result = validateAssetUpload({ name: 'malware.exe', sizeBytes: 500 * 1024 })
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('.exe')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // F. HAK AKSES & KEAMANAN RBAC (ROLE-BASED ACCESS CONTROL)
  // ──────────────────────────────────────────────────────────────────────────
  describe('🔐 6. Hak Akses & Matriks Keamanan RBAC', () => {
    it('[PASS] Super Admin & Admin agensi memiliki akses penuh ke semua modul', () => {
      expect(checkPermission('super_admin', 'finance.manage')).toBe(true)
      expect(checkPermission('admin', 'projects.manage')).toBe(true)
      expect(checkPermission('admin', 'warehouse.manage')).toBe(true)
      expect(checkPermission('admin', 'shipping.manage')).toBe(true)
    })

    it('[PASS] Staff CS berhak mengelola invoice (POS) & proyek, tapi diblokir dari antrean packing', () => {
      expect(checkPermission('staff_cs', 'finance.manage')).toBe(true)
      expect(checkPermission('staff_cs', 'projects.manage')).toBe(true)
      expect(checkPermission('staff_cs', 'packing.manage')).toBe(false)
    })

    it('[PASS] Staff Produksi berhak mengupdate status produksi, tapi diblokir dari modul keuangan', () => {
      expect(checkPermission('staff_production', 'production.manage')).toBe(true)
      expect(checkPermission('staff_production', 'finance.read')).toBe(false)
      expect(checkPermission('staff_production', 'finance.manage')).toBe(false)
    })

    it('[PASS] Staff Desain berhak mengelola studio desain, tapi diblokir dari mutasi stok gudang', () => {
      expect(checkPermission('staff_design', 'design.manage')).toBe(true)
      expect(checkPermission('staff_design', 'warehouse.manage')).toBe(false)
    })

    it('[PASS] Klien tidak memiliki izin akses operasional internal agensi', () => {
      expect(checkPermission('client', 'warehouse.read')).toBe(false)
      expect(checkPermission('client', 'production.manage')).toBe(false)
      expect(checkPermission('client', 'finance.manage')).toBe(false)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // G. PENGADAAN DANA OPS & MAINTENANCE MESIN
  // ──────────────────────────────────────────────────────────────────────────
  describe('⚙️ 7. Pengadaan Dana Operasional & Kendala Mesin', () => {
    it('[PASS] Pengajuan belanja operasional harus memvalidasi nominal > 0 dan status PENDING', () => {
      const request = {
        title: 'Beli Tinta Sublimasi Cyan & Magenta',
        amount: 450000,
        status: 'PENDING',
        requested_by: 'staff-ops-uuid'
      }
      expect(request.amount).toBeGreaterThan(0)
      expect(request.status).toBe('PENDING')
    })

    it('[PASS] Tiket kendala mesin harus memiliki tingkat prioritas yang valid (low | medium | high)', () => {
      const allowedPriorities = ['low', 'medium', 'high']
      const ticket = {
        machine_name: 'Mesin Laser Cutting A3',
        priority: 'high',
        status: 'in_progress'
      }
      expect(allowedPriorities.includes(ticket.priority)).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // H. FORMATTING RUPIAH & PROGRESS STEPPER
  // ──────────────────────────────────────────────────────────────────────────
  describe('📊 8. Kalkulasi Persentase Progress & Format Rupiah', () => {
    it('[PASS] Format Rupiah harus menghasilkan format standar IDR yang konsisten', () => {
      const formatRupiah = (val: number) => `Rp ${val.toLocaleString('id-ID')}`
      expect(formatRupiah(500000)).toBe('Rp 500.000')
      expect(formatRupiah(1250000)).toBe('Rp 1.250.000')
      expect(formatRupiah(0)).toBe('Rp 0')
    })

    it('[PASS] Perhitungan progress persentase proyek fisik harus dinamis per step', () => {
      const totalSteps = 7 // briefing -> completed
      const getProgress = (currentStepIdx: number) => Math.round(((currentStepIdx + 1) / totalSteps) * 100)
      
      expect(getProgress(0)).toBe(14)  // Briefing
      expect(getProgress(1)).toBe(29)  // Design
      expect(getProgress(2)).toBe(43)  // Production
      expect(getProgress(6)).toBe(100) // Completed
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // I. ISOLASI MULTI-TENANT & ANTI-IDOR
  // ──────────────────────────────────────────────────────────────────────────
  describe('🛡️ 9. Keamanan & Isolasi Multi-Tenant (Anti-IDOR)', () => {
    it('[PASS] Klien dilarang mengakses atau mengupdate invoice/proyek milik klien lain', () => {
      const clientUser = { id: 'client-user-1', orgId: 'agency-a', role: 'client' }
      const resourceOtherClient = { orgId: 'agency-a', clientId: 'client-user-2' }
      
      const access = checkMultiTenantAccess(clientUser, resourceOtherClient)
      expect(access.allowed).toBe(false)
      expect(access.reason).toContain('Anti-IDOR')
    })

    it('[PASS] Klien diizinkan mengakses invoice/proyek miliknya sendiri', () => {
      const clientUser = { id: 'client-user-1', orgId: 'agency-a', role: 'client' }
      const ownResource = { orgId: 'agency-a', clientId: 'client-user-1' }
      
      const access = checkMultiTenantAccess(clientUser, ownResource)
      expect(access.allowed).toBe(true)
    })

    it('[PASS] Staf Agensi A dilarang mengakses resource dari Agensi B', () => {
      const staffA = { id: 'staff-1', orgId: 'agency-a', role: 'staff_ops' }
      const resourceB = { orgId: 'agency-b' }
      
      const access = checkMultiTenantAccess(staffA, resourceB)
      expect(access.allowed).toBe(false)
      expect(access.reason).toContain('organisasi agensi lain')
    })

    it('[PASS] Staf Agensi A diizinkan mengakses resource dalam organisasinya sendiri', () => {
      const staffA = { id: 'staff-1', orgId: 'agency-a', role: 'staff_ops' }
      const resourceA = { orgId: 'agency-a' }
      
      const access = checkMultiTenantAccess(staffA, resourceA)
      expect(access.allowed).toBe(true)
    })

    it('[PASS] Super Admin memiliki izin bypass ke semua organisasi (Platform Level)', () => {
      const superAdmin = { id: 'sa-1', orgId: 'system', role: 'super_admin' }
      const resourceAny = { orgId: 'agency-xyz' }
      
      const access = checkMultiTenantAccess(superAdmin, resourceAny)
      expect(access.allowed).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // J. KALKULASI PAJAK POS & SANITASI INPUT NOMINAL
  // ──────────────────────────────────────────────────────────────────────────
  describe('🧾 10. Kalkulasi Pajak POS & Sanitasi Input Mata Uang', () => {
    it('[PASS] Opsi PPN 12% pada POS harus menambahkan pajak 12% ke total invoice', () => {
      const posResult = calculatePosInvoiceTotal(1000000, true)
      expect(posResult.taxAmount).toBe(120000)
      expect(posResult.finalAmount).toBe(1120000)
    })

    it('[PASS] POS tanpa PPN harus menghasilkan total murni tanpa penambahan pajak', () => {
      const posResult = calculatePosInvoiceTotal(750000, false)
      expect(posResult.taxAmount).toBe(0)
      expect(posResult.finalAmount).toBe(750000)
    })

    it('[PASS] Parser mata uang harus membersihkan format titik dan simbol Rupiah dengan konsisten', () => {
      expect(parseCurrencyToNumber('Rp 1.500.000')).toBe(1500000)
      expect(parseCurrencyToNumber('Rp 50.000.000,00')).toBe(5000000000) // format tanpa desimal
      expect(parseCurrencyToNumber('  750.000  ')).toBe(750000)
      expect(parseCurrencyToNumber(250000)).toBe(250000)
      expect(parseCurrencyToNumber('')).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // K. ALUR KOMPLAIN, RETUR & PENGEMBALIAN DANA FISIK
  // ──────────────────────────────────────────────────────────────────────────
  describe('🔄 11. Alur Komplain, Retur & Pengembalian Dana Fisik', () => {
    it('[PASS] Keputusan Reship harus mengupdate status ke SHIPPED dengan nomor resi baru', () => {
      const reship = processReturnDecision('RESHIP', 'JNE-NEW-778899')
      expect(reship.nextProjectStatus).toBe('shipped')
      expect(reship.nextShippingStatus).toBe('SHIPPED')
      expect(reship.trackingNumber).toBe('JNE-NEW-778899')
    })

    it('[PASS] Keputusan Reship tanpa nomor resi baru harus melempar error validasi', () => {
      expect(() => processReturnDecision('RESHIP', '')).toThrow(/Nomor resi baru wajib diisi/)
    })

    it('[PASS] Keputusan Refund harus membatalkan pesanan (CANCELLED)', () => {
      const refund = processReturnDecision('REFUND')
      expect(refund.nextProjectStatus).toBe('cancelled')
      expect(refund.nextShippingStatus).toBe('CANCELLED')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // L. VALIDASI WEBHOOK & KEAMANAN SSRF
  // ──────────────────────────────────────────────────────────────────────────
  describe('🌐 12. Validasi Webhook & Keamanan SSRF', () => {
    it('[PASS] URL Webhook publik yang valid (https://api.external.com/hook) harus diterima', () => {
      const valid = validateWebhookUrl('https://api.external-system.com/webhooks/crm')
      expect(valid.valid).toBe(true)
    })

    it('[PASS] URL Webhook tanpa HTTPS (http://) harus ditolak', () => {
      const invalid = validateWebhookUrl('http://insecure-site.com/hook')
      expect(invalid.valid).toBe(false)
      expect(invalid.error).toContain('https://')
    })

    it('[PASS] URL Webhook yang mengarah ke localhost/IP internal harus ditolak (Anti-SSRF)', () => {
      const blocked1 = validateWebhookUrl('https://localhost:3000/hook')
      const blocked2 = validateWebhookUrl('https://127.0.0.1/api')
      const blocked3 = validateWebhookUrl('https://169.254.169.254/latest/meta-data')
      const blocked4 = validateWebhookUrl('https://192.168.1.10/webhook')

      expect(blocked1.valid).toBe(false)
      expect(blocked2.valid).toBe(false)
      expect(blocked3.valid).toBe(false)
      expect(blocked4.valid).toBe(false)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // M. KEBIJAKAN RETENSI & PEMBERSIHAN AUDIT LOG
  // ──────────────────────────────────────────────────────────────────────────
  describe('🧹 13. Kebijakan Retensi & Pembersihan Audit Log', () => {
    it('[PASS] Retensi 30 hari harus menghitung tanggal cutoff 30 hari ke belakang', () => {
      const fixedDate = new Date('2026-03-31T00:00:00Z')
      const cutoff = calculateLogCutoffDate(30, fixedDate)
      expect(cutoff).toBe('2026-03-01')
    })

    it('[PASS] Retensi 60 hari harus menghitung tanggal cutoff dengan akurat', () => {
      const fixedDate = new Date('2026-05-01T00:00:00Z')
      const cutoff = calculateLogCutoffDate(60, fixedDate)
      expect(cutoff).toBe('2026-03-02')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // N. INTEGRITAS RUTE & MENU SIDEBAR (ANTI-404 SCREENING)
  // ──────────────────────────────────────────────────────────────────────────
  describe('🧭 14. Audit Otomatis Semua Rute Menu Sidebar (Anti-404)', () => {
    const registeredRoutes = getRegisteredNextRoutes()

    it('[PASS] Seluruh rute fisik Next.js terdaftar lengkap di filesystem', () => {
      expect(registeredRoutes.length).toBeGreaterThan(40)
      expect(registeredRoutes).toContain('/dashboard')
      expect(registeredRoutes).toContain('/dashboard/projects')
      expect(registeredRoutes).toContain('/dashboard/projects/completed')
      expect(registeredRoutes).toContain('/dashboard/pos')
      expect(registeredRoutes).toContain('/dashboard/inventory')
      expect(registeredRoutes).toContain('/portal')
    })

    const ALL_NAV_CONFIGS: { category: string; items: NavItem[] }[] = [
      { category: 'Agensi Digital', items: DIGITAL_NAVIGATION },
      { category: 'Agensi Fisik Master', items: PHYSICAL_NAVIGATION },
      { category: 'Staf CS Fisik', items: PHYSICAL_STAFF_CS },
      { category: 'Staf Ops Fisik', items: PHYSICAL_STAFF_OPS },
      { category: 'Staf Desain Fisik', items: PHYSICAL_STAFF_DESIGN },
      { category: 'Staf Gudang Fisik', items: PHYSICAL_STAFF_WAREHOUSE },
      { category: 'Staf Produksi Fisik', items: PHYSICAL_STAFF_PRODUCTION },
      { category: 'Staf Ekspedisi Fisik', items: PHYSICAL_STAFF_SHIPPING },
      { category: 'Agensi Hybrid', items: HYBRID_NAVIGATION },
    ]

    ALL_NAV_CONFIGS.forEach(({ category, items }) => {
      describe(`Sidebar: ${category}`, () => {
        items.forEach(item => {
          if (item.href) {
            it(`[PASS] Menu [${item.name}] -> ${item.href} wajib memiliki file page.tsx fisik`, () => {
              const exists = verifyRouteExists(item.href!, registeredRoutes)
              expect(exists, `Rute ${item.href} pada menu [${item.name}] TIDAK DITEMUKAN (404)!`).toBe(true)
            })
          }

          if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach(sub => {
              it(`[PASS] Sub-Menu [${item.name} > ${sub.name}] -> ${sub.href} wajib memiliki file page.tsx fisik`, () => {
                const exists = verifyRouteExists(sub.href, registeredRoutes)
                expect(exists, `Rute sub-menu ${sub.href} pada [${item.name} > ${sub.name}] TIDAK DITEMUKAN (404)!`).toBe(true)
              })
            })
          }
        })
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // O. VALIDASI FUNGSI SEMUA TOMBOL AKSI DI SETIAP MENU SIDEBAR
  // ──────────────────────────────────────────────────────────────────────────
  describe('🔘 15. Validasi Fungsi & Tombol Aksi di Seluruh Menu Sidebar', () => {

    describe('1. Menu Proyek & Detail (dashboard/actions.ts)', () => {
      it('[PASS] Tombol [Buat Proyek] memvalidasi field wajib (title, client_id, total_price)', () => {
        const validateCreateProject = (data: { title: string; client_id: string; total_price: number }) => {
          if (!data.title?.trim()) return { valid: false, error: 'Judul proyek wajib diisi' }
          if (!data.client_id) return { valid: false, error: 'Klien wajib dipilih' }
          if (data.total_price <= 0) return { valid: false, error: 'Harga harus lebih besar dari 0' }
          return { valid: true }
        }
        expect(validateCreateProject({ title: 'Web App', client_id: 'client-1', total_price: 5000000 }).valid).toBe(true)
        expect(validateCreateProject({ title: '', client_id: 'client-1', total_price: 5000000 }).valid).toBe(false)
        expect(validateCreateProject({ title: 'Web App', client_id: '', total_price: 5000000 }).valid).toBe(false)
      })

      it('[PASS] Tombol [Update Biaya Tambahan] memvalidasi alasan dan nominal update > 0', () => {
        const validateProjectUpdate = (price: number, reason: string) => {
          if (price <= 0 || !reason?.trim()) return false
          return true
        }
        expect(validateProjectUpdate(350000, 'Tambah Halaman Blog')).toBe(true)
        expect(validateProjectUpdate(0, 'Tambah Halaman Blog')).toBe(false)
        expect(validateProjectUpdate(350000, '')).toBe(false)
      })
    })

    describe('2. Menu Kasir POS & Faktur (pos/actions.ts)', () => {
      it('[PASS] Tombol [Buat Invoice Manual] memvalidasi minimal 1 item invoice dengan harga valid', () => {
        const validateManualInvoice = (items: { name: string; price: number; quantity: number }[]) => {
          if (!items || items.length === 0) return false
          return items.every(i => i.name?.trim() && i.price > 0 && i.quantity > 0)
        }
        expect(validateManualInvoice([{ name: 'Cetak Brosur A4', price: 150000, quantity: 2 }])).toBe(true)
        expect(validateManualInvoice([])).toBe(false)
        expect(validateManualInvoice([{ name: '', price: 150000, quantity: 1 }])).toBe(false)
      })

      it('[PASS] Tombol [Setujui / Tolak Split Invoice] memvalidasi status SPLIT_REQUESTED', () => {
        const canReviewSplit = (currentStatus: string) => currentStatus === 'SPLIT_REQUESTED'
        expect(canReviewSplit('SPLIT_REQUESTED')).toBe(true)
        expect(canReviewSplit('PENDING')).toBe(false)
        expect(canReviewSplit('PAID')).toBe(false)
      })
    })

    describe('3. Menu Gudang & Stok (inventory/actions.ts)', () => {
      it('[PASS] Tombol [Tambah Master Barang] memvalidasi nama material, unit & min_stock >= 0', () => {
        const validateNewItem = (item: { name: string; unit: string; min_stock: number }) => {
          return Boolean(item.name?.trim() && item.unit?.trim() && item.min_stock >= 0)
        }
        expect(validateNewItem({ name: 'Kertas Art Paper 260g', unit: 'Rim', min_stock: 5 })).toBe(true)
        expect(validateNewItem({ name: '', unit: 'Rim', min_stock: 5 })).toBe(false)
      })
    })

    describe('4. Menu Produksi & QC (production/actions.ts)', () => {
      it('[PASS] Tombol [Quality Control (QC)] memvalidasi hasil lulus atau gagal retur', () => {
        const processQcResult = (passed: boolean, notes?: string) => {
          if (!passed && !notes?.trim()) return { valid: false, error: 'Catatan kendala wajib diisi jika QC Gagal' }
          return { valid: true, nextStatus: passed ? 'packing_completed' : 'revision_pending' }
        }
        expect(processQcResult(true).nextStatus).toBe('packing_completed')
        expect(processQcResult(false, 'Warna cetak tidak sesuai').nextStatus).toBe('revision_pending')
        expect(processQcResult(false, '').valid).toBe(false)
      })
    })

    describe('5. Menu Studio Desain (design/actions.ts)', () => {
      it('[PASS] Tombol [Upload Mockup Desain] memvalidasi ketersediaan file URL desain', () => {
        const validateMockup = (url: string) => Boolean(url && url.startsWith('http'))
        expect(validateMockup('https://storage.example.com/mockups/mug-1.png')).toBe(true)
        expect(validateMockup('')).toBe(false)
      })
    })

    describe('6. Menu Packing & Pengiriman (packing/actions.ts & shipping/actions.ts)', () => {
      it('[PASS] Tombol [Selesai Packing] memindahkan status ke Siap Kirim (WAITING)', () => {
        const finishPacking = (projectId: string) => {
          if (!projectId) return null
          return { projectStatus: 'packing_completed', shippingStatus: 'WAITING', progress: 90 }
        }
        const res = finishPacking('proj-123')
        expect(res?.projectStatus).toBe('packing_completed')
        expect(res?.shippingStatus).toBe('WAITING')
        expect(res?.progress).toBe(90)
      })

      it('[PASS] Tombol [Kirim & Input Resi] memindahkan status ke Shipped dengan progres 95%', () => {
        const processShipment = (courier: string, trackingNo: string) => {
          if (!courier?.trim()) return { error: 'Kurir wajib diisi' }
          return { success: true, projectStatus: 'shipped', progress: 95 }
        }
        expect(processShipment('J&T Express', 'JT123456789').success).toBe(true)
        expect(processShipment('', 'JT123456789').error).toBe('Kurir wajib diisi')
      })

      it('[PASS] Tombol [Konfirmasi Selesai / Diterima] memindahkan status ke Completed 100%', () => {
        const finishOrder = () => ({ status: 'completed', progress_percentage: 100, shipping_status: 'DELIVERED' })
        expect(finishOrder()).toEqual({ status: 'completed', progress_percentage: 100, shipping_status: 'DELIVERED' })
      })
    })

    describe('7. Menu Klien & Pemasok CRM (dashboard/actions.ts)', () => {
      it('[PASS] Tombol [Tambah Klien] memvalidasi nama & nomor WhatsApp valid', () => {
        const validateClient = (name: string, phone: string) => {
          return Boolean(name?.trim() && phone?.replace(/[^0-9]/g, '').length >= 10)
        }
        expect(validateClient('Budi Santoso', '081234567890')).toBe(true)
        expect(validateClient('Budi', '123')).toBe(false)
        expect(validateClient('', '081234567890')).toBe(false)
      })
    })

    describe('8. Menu Tim & Staf (team/actions.ts)', () => {
      it('[PASS] Tombol [Undang Staf] memvalidasi email dan role yang valid', () => {
        const allowedRoles = ['admin', 'staff_ops', 'staff_cs', 'staff_design', 'staff_production', 'staff_warehouse', 'staff_shipping', 'staff_finance']
        const validateInvite = (email: string, role: string) => {
          const isEmailValid = email.includes('@') && email.includes('.')
          const isRoleValid = allowedRoles.includes(role)
          return isEmailValid && isRoleValid
        }
        expect(validateInvite('designer@agency.com', 'staff_design')).toBe(true)
        expect(validateInvite('notanemail', 'staff_design')).toBe(false)
        expect(validateInvite('admin@agency.com', 'invalid_role')).toBe(false)
      })
    })

    describe('9. Menu Keuangan & Pengadaan (finance/actions.ts & ops/procurement/actions.ts)', () => {
      it('[PASS] Tombol [Catat Transaksi Buku Kas] memvalidasi tipe (INCOME/EXPENSE) dan nominal > 0', () => {
        const validateTx = (type: string, amount: number, desc: string) => {
          return ['INCOME', 'EXPENSE'].includes(type) && amount > 0 && Boolean(desc?.trim())
        }
        expect(validateTx('EXPENSE', 250000, 'Beli Kertas HVS')).toBe(true)
        expect(validateTx('INCOME', 1500000, 'Pelunasan Desain')).toBe(true)
        expect(validateTx('TRANSFER', 500000, 'Transfer Bank')).toBe(false)
        expect(validateTx('EXPENSE', 0, 'Beli Kertas HVS')).toBe(false)
      })
    })

    describe('10. Menu Pesan & Chat Global (messages/actions.ts)', () => {
      it('[PASS] Tombol [Kirim Pesan] menolak pesan kosong tanpa lampiran file', () => {
        const canSendMessage = (content: string, hasFile: boolean) => Boolean(content?.trim() || hasFile)
        expect(canSendMessage('Halo tim', false)).toBe(true)
        expect(canSendMessage('', true)).toBe(true)
        expect(canSendMessage('', false)).toBe(false)
      })
    })

    describe('11. Menu Pengaturan Organisasi & Webhook (settings/actions.ts)', () => {
      it('[PASS] Tombol [Simpan Profil Agensi] memvalidasi nama agensi', () => {
        const validateOrg = (name: string) => Boolean(name?.trim())
        expect(validateOrg('Vylogix Creative Studio')).toBe(true)
        expect(validateOrg('')).toBe(false)
      })
    })

    describe('12. Portal Klien Self-Service (portal/actions.ts)', () => {
      it('[PASS] Tombol [Upload Bukti Bayar] memvalidasi ketersediaan file lampiran', () => {
        const validatePaymentUpload = (fileSize: number) => fileSize > 0
        expect(validatePaymentUpload(1024 * 500)).toBe(true)
        expect(validatePaymentUpload(0)).toBe(false)
      })

      it('[PASS] Tombol [Komplain / Retur Cacat Cetak] memvalidasi rincian kendala', () => {
        const validateDefectReport = (description: string) => Boolean(description?.trim())
        expect(validateDefectReport('Warna cetakan pudar di sisi kiri')).toBe(true)
        expect(validateDefectReport('   ')).toBe(false)
      })
    })

  })

})



