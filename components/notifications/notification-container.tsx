// frontend/components/notifications/notification-container.tsx
"use client"

import { useEffect, useState } from "react"
import { notificationService, type Notification } from "@/lib/notification-service"
import { NotificationToast } from "./notification-toast"

export function NotificationContainer() {
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuthToken, setHasAuthToken] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken")
      setHasAuthToken(!!token)
    }
  }, [])

  useEffect(() => {
    if (!hasAuthToken) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    let intervalId: NodeJS.Timeout

    const fetchNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications()

        if (!isMounted) return

        // SUPPRIMER cette partie qui marque automatiquement comme lues
        // Seulement afficher les nouvelles notifications sans les marquer comme lues
        const newNotifications = notifications.filter(
          (notification) => !displayedNotifications.find((n) => n._id === notification._id),
        )

        if (newNotifications.length > 0) {
          setDisplayedNotifications((prev) => [...prev, ...newNotifications])
          
          // NE PAS marquer comme lues automatiquement
          // L'utilisateur doit cliquer sur la cloche pour les marquer comme lues
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchNotifications()

    // Check for new notifications every 10 seconds
    intervalId = setInterval(fetchNotifications, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [hasAuthToken])

  const handleCloseNotification = (notificationId: string) => {
    setDisplayedNotifications((prev) => prev.filter((n) => n._id !== notificationId))
  }

  if (!hasAuthToken) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {displayedNotifications.map((notification) => (
        <div key={notification._id} className="pointer-events-auto">
          <NotificationToast notification={notification} onClose={() => handleCloseNotification(notification._id)} />
        </div>
      ))}
    </div>
  )
}