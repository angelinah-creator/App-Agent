"use client"

import { Settings } from "lucide-react"
import type React from "react"

interface HeaderProps {
  title: string
  subtitle: string
  userInitials: string
  notificationBell?: React.ReactNode
}

export function Header({ title, subtitle, userInitials, notificationBell }: HeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent uppercase">
          {title}
        </h2>
        <p className="text-slate-600 mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        {notificationBell}
        {/* <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110">
          <Settings className="w-5 h-5 text-slate-600" />
        </button> */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
          {userInitials}
        </div>
      </div>
    </div>
  )
}