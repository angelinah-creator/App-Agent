"use client"

import { Settings, User, Camera } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { ProfileModal } from "./modals/profile-modal"
import { useQuery } from "@tanstack/react-query"
import { authService } from "@/lib/auth-service"

interface HeaderProps {
  title: string
  subtitle: string
  notificationBell?: React.ReactNode
}

export function Header({ title, subtitle, notificationBell }: HeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  })

  const getInitials = () => {
    if (!userProfile) return "??"
    return `${userProfile.prenoms?.[0] || ''}${userProfile.nom?.[0] || ''}`.toUpperCase()
  }

  return (
    <>
      <div className="bg-[#1F2128] backdrop-blur-xl border-b border-[#313442] px-8 py-1 pr-10 flex items-center justify-end sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
          {notificationBell}
          
          <button
            onClick={() => setShowProfileModal(true)}
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
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                {/* <Camera className="w-5 h-5 text-white" /> */}
              </div>
            </div>
          </button>
        </div>
      </div>

      {showProfileModal && userProfile && (
        <ProfileModal
          user={userProfile}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  )
}