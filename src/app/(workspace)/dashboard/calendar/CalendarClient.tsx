'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Project {
  id: string
  title: string
  deadline: string | null
  production_deadline?: string | null
  status: string
}

export default function CalendarClient({ projects }: { projects: Project[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const getProjectsForDay = (day: number) => {
    return projects.filter(p => {
      let isFinalDeadline = false;
      let isProdDeadline = false;

      if (p.deadline) {
        const d = new Date(p.deadline)
        isFinalDeadline = d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
      }
      
      if (p.production_deadline) {
        const pd = new Date(p.production_deadline)
        isProdDeadline = pd.getDate() === day && pd.getMonth() === currentDate.getMonth() && pd.getFullYear() === currentDate.getFullYear()
      }

      return isFinalDeadline || isProdDeadline;
    }).map(p => {
      let types = [];
      if (p.deadline) {
        const d = new Date(p.deadline)
        if (d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
          types.push('FINAL')
        }
      }
      if (p.production_deadline) {
        const pd = new Date(p.production_deadline)
        if (pd.getDate() === day && pd.getMonth() === currentDate.getMonth() && pd.getFullYear() === currentDate.getFullYear()) {
          types.push('PROD')
        }
      }
      return { ...p, dayTypes: types }
    })
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    design: 'bg-purple-100 text-purple-800 border-purple-200',
    production: 'bg-blue-100 text-blue-800 border-blue-200',
    ready_to_ship: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    shipping: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  const getStatusColor = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium border border-gray-200"
          >
            Hari Ini
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {dayNames.map((day) => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
        {/* Empty cells for days before the 1st of the month */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-white min-h-[120px] p-2 opacity-50" />
        ))}
        
        {/* Cells for each day of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayProjects = getProjectsForDay(day)
          const isToday = 
            day === new Date().getDate() && 
            currentDate.getMonth() === new Date().getMonth() && 
            currentDate.getFullYear() === new Date().getFullYear()

          return (
            <div key={day} className={`bg-white min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
              <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 no-scrollbar">
                {dayProjects.map((project: any, i) => (
                  <div key={`${project.id}-${i}`} className="flex flex-col gap-1">
                    {project.dayTypes.map((type: string) => (
                      <div 
                        key={`${project.id}-${type}`} 
                        className={`text-[10px] px-1.5 py-1 rounded-sm border truncate cursor-pointer hover:opacity-80 transition-opacity flex justify-between items-center gap-1 ${
                          type === 'PROD' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-red-50 text-red-800 border-red-200 font-bold'
                        }`}
                        title={`${type === 'PROD' ? 'Deadline Produksi' : 'Deadline Klien'}: ${project.title}`}
                      >
                        <span className="truncate">{project.title}</span>
                        <span className="shrink-0 opacity-70">[{type}]</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Empty cells to complete the grid if needed */}
        {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, index) => (
          <div key={`empty-end-${index}`} className="bg-white min-h-[120px] p-2 opacity-50" />
        ))}
      </div>
    </div>
  )
}
