import React from 'react'

export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-[24px] border border-black/5 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-72 bg-gray-100 rounded-md"></div>
          </div>
          <div className="h-10 w-24 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
          <div className="h-20 bg-gray-50 rounded-2xl"></div>
          <div className="h-20 bg-gray-50 rounded-2xl"></div>
          <div className="h-20 bg-gray-50 rounded-2xl"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm h-64"></div>
        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm h-64"></div>
      </div>
    </div>
  )
}
