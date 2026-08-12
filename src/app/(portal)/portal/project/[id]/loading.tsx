import React from 'react'

export default function PortalProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-36 bg-gray-200 rounded mb-6"></div>

      {/* Project Banner Skeleton */}
      <div className="bg-white rounded-[24px] border border-black/5 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-100 rounded-md"></div>
            </div>
            <div className="h-8 w-64 md:w-96 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-48 bg-gray-100 rounded-md"></div>
          </div>
          <div className="h-16 w-28 bg-gray-100 rounded-2xl"></div>
        </div>

        {/* Stepper Skeleton */}
        <div className="pt-6 border-t border-gray-100 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-200"></div>
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-xl"></div>
      </div>

      {/* Detail Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm h-72"></div>
        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm h-72"></div>
      </div>
    </div>
  )
}
