"use client"

import type React from "react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { authService } from "@/lib/auth-service"

interface HeaderProps {
  title: string
  subtitle: string
  notificationBell?: React.ReactNode
  onProfileClick?: () => void
}

export function Header({ title, subtitle, notificationBell, onProfileClick }: HeaderProps) {  
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  })

  const getInitials = () => {
    if (!userProfile) return "??"
    return `${userProfile.prenoms?.[0] || ''}${userProfile.nom?.[0] || ''}`.toUpperCase()
  }

  const handleProfileClick = () => {
    // Si onProfileClick est fourni, on l'utilise pour naviguer vers l'onglet profil
    if (onProfileClick) {
      onProfileClick()
    }
  }

  return (
    <>
      <div className="bg-[#1F2128] backdrop-blur-xl border-b border-[#313442] px-8 py-1 pr-10 flex items-center justify-end sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
          {notificationBell}
          
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
          >
            <div className="relative group">
              {userProfile?.profilePhoto?.url ? (
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#313442]">
                  <img 
                    src={userProfile.profilePhoto.url} 
                    alt={`${userProfile.prenoms} ${userProfile.nom}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#6C4EA8] flex items-center justify-center text-white font-semibold shadow-indigo-500/30">
                  {getInitials()}
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}