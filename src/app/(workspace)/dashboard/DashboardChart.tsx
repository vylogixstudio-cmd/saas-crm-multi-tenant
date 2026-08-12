'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useState, useMemo } from 'react'

interface TransactionData {
  id: string
  created_at: string
  amount: number | string
  type: string
}

export default function DashboardChart({ transactions }: { transactions: TransactionData[] }) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')

  // Proses data
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const dataMap: Record<string, { name: string, Pemasukan: number, Pengeluaran: number, sortKey: string }> = {}

    transactions.forEach(t => {
      const date = new Date(t.created_at)
      let key = ''
      let label = ''

      if (viewMode === 'monthly') {
        const month = date.toLocaleString('id-ID', { month: 'short' })
        const year = date.getFullYear()
        key = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}` // For correct sorting: YYYY-MM
        label = `${month} ${year}`
      } else {
        const year = date.getFullYear()
        key = `${year}`
        label = `${year}`
      }

      if (!dataMap[key]) {
        dataMap[key] = { name: label, Pemasukan: 0, Pengeluaran: 0, sortKey: key }
      }

      const amount = Number(t.amount || 0)

      if (t.type === 'INCOME') {
        dataMap[key].Pemasukan += amount
      } else if (t.type === 'EXPENSE') {
        dataMap[key].Pengeluaran += amount
      }
    })

    return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [transactions, viewMode])

  return (
    <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-extrabold text-lg text-[#111827]">Arus Kas (Cash Flow)</h3>
          <p className="text-[11px] text-[#6B7280] mt-1 font-medium">Berdasarkan mutasi pemasukan & pengeluaran aktual</p>
        </div>
        <select 
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'monthly' | 'yearly')}
          className="bg-[#F8F9FA] border border-black/10 text-xs font-bold text-[#4B5563] px-3 py-2 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors"
        >
          <option value="monthly">Per Bulan</option>
          <option value="yearly">Per Tahun</option>
        </select>
      </div>

      <div className="flex-1 w-full relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}}
                tickFormatter={(value) => value >= 1000000 ? `Rp ${(value / 1000000).toFixed(0)}M` : `Rp ${value.toLocaleString('id-ID')}`}
                width={70}
              />
              <Tooltip 
                cursor={{fill: '#F9FAFB'}}
                contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '4px 0' }}
                labelStyle={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, undefined]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700, color: '#4B5563' }} 
                iconType="circle" 
                iconSize={8}
              />
              <Bar dataKey="Pemasukan" fill="#2563EB" radius={[6, 6, 6, 6]} maxBarSize={30} />
              <Bar dataKey="Pengeluaran" fill="#F43F5E" radius={[6, 6, 6, 6]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#9CA3AF] bg-[#F8F9FA] rounded-[16px] border border-dashed border-black/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-50"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            <p className="text-sm font-bold text-[#6B7280]">Belum ada arus kas</p>
            <p className="text-[10px] mt-1">Data pemasukan/pengeluaran akan tampil di sini</p>
          </div>
        )}
      </div>
    </div>
  )
}
