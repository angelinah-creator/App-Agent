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
    <div className=" bg-[#1F2128] backdrop-blur-xl border-b border-[#313442] px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div>
        {/* <h2 className="text-3xl font-bold text-[#FFFFFF] uppercase">
          {title}
        </h2> */}
        {/* <p className="text-[#FFFFFF] mt-1">{subtitle}</p> */}
      </div>
      <div className="flex items-center gap-4">
        {notificationBell}
        <div className="w-11 h-11 rounded-xl bg-[#6C4EA8] flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
          {userInitials}
        </div>
      </div>
    </div>
  )
}