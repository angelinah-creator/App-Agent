// frontend/lib/notification-service.ts
export interface Notification {
  _id: string
  userId: string
  type:
    | "ABSENCE_CREATED"
    | "ABSENCE_APPROVED"
    | "ABSENCE_REJECTED"
    | "ABSENCE_PENDING"
    | "INVOICE_CREATED"
    | "INVOICE_PAID"
    | "INVOICE_OVERDUE"
    | "INVOICE_CANCELLED"
    | "SYSTEM"
    | "info"
    | "success"
    | "warning"
    | "error"
  title: string
  message: string
  read: boolean
  readAt?: Date
  absenceId?: string
  invoiceId?: string
  createdAt: Date
  updatedAt: Date
}

export type NotificationType = Notification["type"]

class NotificationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken()

    if (!token) {
      throw new Error("No authentication token found")
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Request failed" }))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response
  }

  /**
   * Récupérer toutes les notifications
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await this.fetchWithAuth("/notifications")
    return response.json()
  }

  /**
   * Récupérer uniquement les notifications non lues
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await this.fetchWithAuth("/notifications/unread")
    return response.json()
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.fetchWithAuth("/notifications/unread-count")
    const data = await response.json()
    return data.count || 0
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await this.fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: "PUT",
    })
    return response.json()
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await this.fetchWithAuth("/notifications/read-all", {
      method: "PUT",
    })
    return response.json()
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.fetchWithAuth(`/notifications/${notificationId}`, {
      method: "DELETE",
    })
  }

  /**
   * Supprimer toutes les notifications lues
   */
  async deleteReadNotifications(): Promise<void> {
    await this.fetchWithAuth("/notifications/read/all", {
      method: "DELETE",
    })
  }
}

// Export singleton
export const notificationService = new NotificationService()