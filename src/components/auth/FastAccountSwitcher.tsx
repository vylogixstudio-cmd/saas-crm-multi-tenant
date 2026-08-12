'use client'

import React, { useState } from 'react'
import {
  SUPER_ADMIN_ACCOUNT,
  DEMO_AGENCIES,
  DemoAccount,
  DemoAgency,
} from '@/data/demoAccounts'
import {
  Shield,
  Laptop,
  Printer,
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  Zap,
  UserCheck,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  User,
} from 'lucide-react'

type MainCategory = 'super_admin' | 'digital' | 'physical' | 'hybrid'

export default function FastAccountSwitcher() {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('super_admin')
  const [selectedDigitalIdx, setSelectedDigitalIdx] = useState(0)
  const [selectedPhysicalIdx, setSelectedPhysicalIdx] = useState(0)
  const [selectedHybridIdx, setSelectedHybridIdx] = useState(0)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [activeFilledAccount, setActiveFilledAccount] = useState<string | null>(null)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({})

  // Fill credentials directly into the login form inputs
  const handleAutoFill = (acc: DemoAccount) => {
    const emailInput = document.getElementById('login-email') as HTMLInputElement | null
    const passwordInput = document.getElementById('login-password') as HTMLInputElement | null

    if (emailInput) {
      emailInput.value = acc.email
      // Dispatch input event to notify any form listener
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      emailInput.dispatchEvent(new Event('change', { bubbles: true }))
    }

    if (passwordInput && acc.password) {
      passwordInput.value = acc.password
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }))
    }

    setActiveFilledAccount(acc.email)
    // Highlight input visually
    if (emailInput) {
      emailInput.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/50')
      setTimeout(() => {
        emailInput.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/50')
      }, 1200)
    }
  }

  // Clear inputs
  const handleClearForm = () => {
    const emailInput = document.getElementById('login-email') as HTMLInputElement | null
    const passwordInput = document.getElementById('login-password') as HTMLInputElement | null

    if (emailInput) {
      emailInput.value = ''
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      emailInput.dispatchEvent(new Event('change', { bubbles: true }))
    }

    if (passwordInput) {
      passwordInput.value = ''
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }))
    }

    setActiveFilledAccount(null)
  }

  const handleCopy = (text: string, email: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const togglePasswordVisibility = (email: string) => {
    setShowPasswordMap(prev => ({ ...prev, [email]: !prev[email] }))
  }

  // Get currently active agency
  const currentAgency: DemoAgency | null =
    activeCategory === 'digital'
      ? DEMO_AGENCIES.digital[selectedDigitalIdx]
      : activeCategory === 'physical'
      ? DEMO_AGENCIES.physical[selectedPhysicalIdx]
      : activeCategory === 'hybrid'
      ? DEMO_AGENCIES.hybrid[selectedHybridIdx]
      : null

  const agencyList: DemoAgency[] =
    activeCategory === 'digital'
      ? DEMO_AGENCIES.digital
      : activeCategory === 'physical'
      ? DEMO_AGENCIES.physical
      : activeCategory === 'hybrid'
      ? DEMO_AGENCIES.hybrid
      : []

  const currentIdx =
    activeCategory === 'digital'
      ? selectedDigitalIdx
      : activeCategory === 'physical'
      ? selectedPhysicalIdx
      : selectedHybridIdx

  const setAgencyIdx = (idx: number) => {
    if (activeCategory === 'digital') setSelectedDigitalIdx(idx)
    else if (activeCategory === 'physical') setSelectedPhysicalIdx(idx)
    else if (activeCategory === 'hybrid') setSelectedHybridIdx(idx)
  }

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/50 p-4 sm:p-6 mb-8 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Zap className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Fast Account Switcher</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wide">
                Demo Ready
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Pilih akun pengujian untuk mengisi email & katasandi secara instan.
            </p>
          </div>
        </div>

        {/* Clear Form Button */}
        <button
          type="button"
          onClick={handleClearForm}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 hover:border-rose-200 transition-all active:scale-95"
          title="Kosongkan form input login"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Main Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4 p-1 bg-gray-100/80 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveCategory('super_admin')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeCategory === 'super_admin'
              ? 'bg-white text-rose-700 shadow-sm shadow-black/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('digital')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeCategory === 'digital'
              ? 'bg-white text-blue-700 shadow-sm shadow-black/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Agensi Digital</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('physical')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeCategory === 'physical'
              ? 'bg-white text-amber-700 shadow-sm shadow-black/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Agensi Fisik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('hybrid')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeCategory === 'hybrid'
              ? 'bg-white text-indigo-700 shadow-sm shadow-black/5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agensi Hybrid</span>
        </button>
      </div>

      {/* Sub-Tabs / Agency Selector (for Digital, Physical, Hybrid) */}
      {activeCategory !== 'super_admin' && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 shrink-0">
            <Building className="w-3.5 h-3.5" /> Tenant:
          </span>
          {agencyList.map((agency, idx) => (
            <button
              key={agency.id}
              type="button"
              onClick={() => setAgencyIdx(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                currentIdx === idx
                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-xs font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {agency.name}
            </button>
          ))}
        </div>
      )}

      {/* Active Selection Banner */}
      {currentAgency && (
        <div className="mt-3 p-2.5 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/30 rounded-xl border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-gray-900">{currentAgency.name}</span>
            <span className="text-gray-400 mx-1.5">•</span>
            <span className="text-gray-600 italic text-[11px]">{currentAgency.tagline}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 bg-white rounded-md border border-gray-200 text-[10px] font-bold text-gray-700 uppercase">
              Tipe: {currentAgency.industryType}
            </span>
          </div>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="mt-4 space-y-3">
        {/* SUPER ADMIN VIEW */}
        {activeCategory === 'super_admin' && (
          <div className="border border-rose-100 rounded-xl bg-rose-50/20 p-3.5 transition-all hover:border-rose-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                    {SUPER_ADMIN_ACCOUNT.roleTitle}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {SUPER_ADMIN_ACCOUNT.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                    {SUPER_ADMIN_ACCOUNT.email}
                  </span>
                  <div className="flex items-center gap-1 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                    <KeyRound className="w-3 h-3 text-gray-400" />
                    <span>
                      {showPasswordMap[SUPER_ADMIN_ACCOUNT.email]
                        ? SUPER_ADMIN_ACCOUNT.password
                        : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(SUPER_ADMIN_ACCOUNT.email)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordMap[SUPER_ADMIN_ACCOUNT.email] ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">{SUPER_ADMIN_ACCOUNT.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(SUPER_ADMIN_ACCOUNT.email, SUPER_ADMIN_ACCOUNT.email)}
                  className="p-2 rounded-lg text-gray-500 bg-white hover:bg-gray-100 border border-gray-200 transition-all"
                  title="Salin Email"
                >
                  {copiedEmail === SUPER_ADMIN_ACCOUNT.email ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFill(SUPER_ADMIN_ACCOUNT)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                    activeFilledAccount === SUPER_ADMIN_ACCOUNT.email
                      ? 'bg-emerald-600 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                  }`}
                >
                  {activeFilledAccount === SUPER_ADMIN_ACCOUNT.email ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Terisi!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Gunakan Akun</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AGENCY STAFF & CLIENTS VIEW */}
        {currentAgency && (
          <div className="space-y-4">
            {/* Staff Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Akun Staf & Manajemen ({currentAgency.accounts.length} Role)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentAgency.accounts.map(acc => {
                  const isFilled = activeFilledAccount === acc.email
                  const isPasswordVisible = showPasswordMap[acc.email]

                  return (
                    <div
                      key={acc.email}
                      className={`p-3 rounded-xl border transition-all ${
                        isFilled
                          ? 'bg-blue-50/60 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-gray-50/50 hover:bg-white border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${acc.badgeColor.bg} ${acc.badgeColor.text} border ${acc.badgeColor.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${acc.badgeColor.dot}`}
                              ></span>
                              {acc.roleTitle}
                            </span>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {acc.name}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-gray-600 flex flex-wrap items-center gap-1.5">
                            <span className="truncate max-w-[180px] bg-white px-1.5 py-0.5 rounded border border-gray-200/80">
                              {acc.email}
                            </span>
                            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200/80">
                              <span className="text-[10px]">
                                {isPasswordVisible ? acc.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(acc.email)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {isPasswordVisible ? (
                                  <EyeOff className="w-2.5 h-2.5" />
                                ) : (
                                  <Eye className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-[10px] text-gray-500 line-clamp-1">
                            {acc.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAutoFill(acc)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs active:scale-95 flex items-center gap-1 ${
                              isFilled
                                ? 'bg-emerald-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isFilled ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Terisi</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                <span>Pilih</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(acc.email, acc.email)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 bg-white border border-gray-200 text-[10px]"
                            title="Salin Email"
                          >
                            {copiedEmail === acc.email ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Clients Section */}
            {currentAgency.clients && currentAgency.clients.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akun Customer / Klien Demo (Portal View)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentAgency.clients.map(client => {
                    const isFilled = activeFilledAccount === client.email
                    const isPasswordVisible = showPasswordMap[client.email]

                    return (
                      <div
                        key={client.email}
                        className={`p-3 rounded-xl border transition-all ${
                          isFilled
                            ? 'bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-gray-50/40 hover:bg-white border-gray-200/80 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                {client.roleTitle}
                              </span>
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {client.name}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-gray-600 flex flex-wrap items-center gap-1.5">
                              <span className="truncate max-w-[180px] bg-white px-1.5 py-0.5 rounded border border-gray-200/80">
                                {client.email}
                              </span>
                              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200/80">
                                <span className="text-[10px]">
                                  {isPasswordVisible ? client.password : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(client.email)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isPasswordVisible ? (
                                    <EyeOff className="w-2.5 h-2.5" />
                                  ) : (
                                    <Eye className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-gray-500 line-clamp-1">
                              {client.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAutoFill(client)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs active:scale-95 flex items-center gap-1 ${
                                isFilled
                                  ? 'bg-emerald-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {isFilled ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Terisi</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  <span>Pilih</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopy(client.email, client.email)}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 bg-white border border-gray-200 text-[10px]"
                              title="Salin Email"
                            >
                              {copiedEmail === client.email ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
