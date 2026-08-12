'use client'

import { useState, useEffect } from 'react'
import PosClient from './PosClient'
import PosRightPanel from './PosRightPanel'
import { FileText, Building2, CheckCircle, Trash2, SplitSquareHorizontal } from 'lucide-react'
import PosProjectInvoices from './PosProjectInvoices'
import PosConfirmationInvoices from './PosConfirmationInvoices'
import PosCancelledInvoices from './PosCancelledInvoices'
import PosClientInstallments from './PosClientInstallments'

import { useSearchParams, useRouter } from 'next/navigation'

export default function PosLayout({
  clients,
  projects,
  services,
  invoices,
  rawInvoices,
}: {
  clients: any[]
  projects: any[]
  services: any[]
  invoices: any[]
  rawInvoices: any[]
}) {
  type TabType = 'manual' | 'project' | 'confirmation' | 'cancelled' | 'client_split'
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') as TabType) || 'manual'

  const waitingCount = rawInvoices.filter(i => i.status === 'WAITING_CONFIRMATION').length
  const splitRequestCount = rawInvoices.filter(i => i.status === 'SPLIT_REQUESTED').length

  return (
    <div className="space-y-6">

      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <PosClient
              clients={clients}
              projects={projects}
              services={services}
              invoices={invoices}
            />
          </div>
          <div className="lg:col-span-3">
            <PosRightPanel
              invoices={rawInvoices.filter(i => !i.project_id && i.status !== 'CANCELLED')}
            />
          </div>
        </div>
      )}

      {activeTab === 'project' && (
        <PosProjectInvoices invoices={rawInvoices.filter(i => i.project_id && (i.status === 'PENDING' || i.status === 'UNPAID'))} clients={clients} />
      )}

      {activeTab === 'confirmation' && (
        <PosConfirmationInvoices invoices={rawInvoices.filter(i => i.status === 'WAITING_CONFIRMATION' || i.status === 'PAID')} clients={clients} />
      )}

      {activeTab === 'cancelled' && (
        <PosCancelledInvoices invoices={rawInvoices.filter(i => i.status === 'CANCELLED')} clients={clients} />
      )}

      {activeTab === 'client_split' && (
        <PosClientInstallments invoices={rawInvoices} clients={clients} />
      )}
    </div>
  )
}
