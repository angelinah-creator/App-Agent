"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import type { Notification } from "@/lib/notification-service"
import { Button } from "@/components/ui/button"

interface NotificationToastProps {
  notification: Notification
  onClose: () => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "ABSENCE_CREATED":
        return "bg-blue-500"
      case "ABSENCE_APPROVED":
      case "success":
        return "bg-green-500"
      case "ABSENCE_REJECTED":
      case "error":
        return "bg-red-500"
      case "ABSENCE_PENDING":
      case "warning":
        return "bg-yellow-500"
      case "INVOICE_CREATED":
      case "info":
        return "bg-blue-500"
      case "INVOICE_PAID":
        return "bg-green-500"
      case "INVOICE_OVERDUE":
        return "bg-orange-500"
      case "INVOICE_CANCELLED":
        return "bg-gray-500"
      case "SYSTEM":
      default:
        return "bg-gray-500"
    }
  }

  if (!notification) {
    return null
  }

  return (
    <div
      className={`
        bg-background border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
        transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex gap-3">
        <div className={`w-1 rounded-full ${getNotificationColor(notification.type)}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        </div>
      </div>
    </div>
  )
}
