// frontend/components/notifications/notification-bell.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  X,
  User,
  Calendar,
  FileText,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  notificationService,
  type Notification,
} from "@/lib/notification-service";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Polling toutes les 10 secondes pour le temps réel
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Erreur récupération notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, read: true, readAt: new Date() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur marquage lu:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur marquage tout lu:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const notification = notifications.find((n) => n._id === notificationId);
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      // Si la notification supprimée était non lue, décrémenter le compteur
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur suppression notification:", error);
    }
  };

  const handleDeleteRead = async () => {
    try {
      await notificationService.deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (error) {
      console.error("Erreur suppression notifications lues:", error);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "ABSENCE_APPROVED":
        return "✅";
      case "ABSENCE_REJECTED":
        return "❌";
      case "ABSENCE_PENDING":
      case "ABSENCE_CREATED":
        return "⏳";
      case "INVOICE_CREATED":
        return "📄";
      case "INVOICE_PAID":
        return "💰";
      case "INVOICE_OVERDUE":
        return "⚠️";
      case "INVOICE_CANCELLED":
        return "🚫";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "ABSENCE_APPROVED":
      case "INVOICE_PAID":
        return "text-green-600";
      case "ABSENCE_REJECTED":
      case "INVOICE_CANCELLED":
        return "text-red-600";
      case "ABSENCE_PENDING":
      case "ABSENCE_CREATED":
      case "INVOICE_OVERDUE":
        return "text-orange-600";
      default:
        return "text-blue-600";
    }
  };

  // Fonction améliorée pour obtenir le nom de l'utilisateur
  const getUserName = (notification: Notification): string => {
    try {
      // Si userId est un objet peuplé
      if (notification.userId && typeof notification.userId === "object") {
        const user = notification.userId as any;
        if (user.nom && user.prenoms) {
          return `${user.prenoms} ${user.nom}`;
        }
        if (user.email) {
          return user.email;
        }
      }

      // Si absenceId est peuplé avec agentId
      if (
        notification.absenceId &&
        typeof notification.absenceId === "object"
      ) {
        const absence = notification.absenceId as any;
        if (absence.agentId && typeof absence.agentId === "object") {
          const agent = absence.agentId;
          if (agent.nom && agent.prenoms) {
            return `${agent.prenoms} ${agent.nom}`;
          }
        }
      }

      // Si invoiceId est peuplé avec agentId
      if (
        notification.invoiceId &&
        typeof notification.invoiceId === "object"
      ) {
        const invoice = notification.invoiceId as any;
        if (invoice.agentId && typeof invoice.agentId === "object") {
          const agent = invoice.agentId;
          if (agent.nom && agent.prenoms) {
            return `${agent.prenoms} ${agent.nom}`;
          }
        }
      }

      // Fallback basé sur le type de notification
      switch (notification.type) {
        case "ABSENCE_CREATED":
        case "ABSENCE_APPROVED":
        case "ABSENCE_REJECTED":
        case "ABSENCE_PENDING":
          return "Un agent";
        case "INVOICE_CREATED":
        case "INVOICE_PAID":
        case "INVOICE_OVERDUE":
        case "INVOICE_CANCELLED":
          return "Un prestataire";
        default:
          return "Utilisateur";
      }
    } catch (error) {
      console.error("Erreur récupération nom utilisateur:", error);
      return "Utilisateur";
    }
  };

  // Fonction pour obtenir l'email de l'utilisateur
  const getUserEmail = (notification: Notification): string => {
    try {
      // Si userId est un objet peuplé
      if (notification.userId && typeof notification.userId === "object") {
        const user = notification.userId as any;
        if (user.email) {
          return user.email;
        }
      }

      // Si absenceId est peuplé avec agentId
      if (
        notification.absenceId &&
        typeof notification.absenceId === "object"
      ) {
        const absence = notification.absenceId as any;
        if (absence.agentId && typeof absence.agentId === "object") {
          const agent = absence.agentId;
          if (agent.email) {
            return agent.email;
          }
        }
      }

      // Si invoiceId est peuplé avec agentId
      if (
        notification.invoiceId &&
        typeof notification.invoiceId === "object"
      ) {
        const invoice = notification.invoiceId as any;
        if (invoice.agentId && typeof invoice.agentId === "object") {
          const agent = invoice.agentId;
          if (agent.email) {
            return agent.email;
          }
        }
      }

      return "";
    } catch (error) {
      return "";
    }
  };

  // Marquer toutes les notifications comme lues quand on ouvre le popover
  // Dans handlePopoverOpen - marquer automatiquement
  const handlePopoverOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <div>
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-600">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {notifications.some((n) => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteRead}
                className="text-xs h-8"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Suppr. lues
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-8"
              >
                <Check className="w-3 h-3 mr-1" />
                Tout marquer
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-600">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const userName = getUserName(notification);
                const userEmail = getUserEmail(notification);

                return (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-slate-50 transition-colors relative group ${
                      !notification.read
                        ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium leading-tight ${getNotificationColor(
                              notification.type
                            )}`}
                          >
                            {notification.title}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDelete(notification._id)}
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Affichage du nom et email de l'utilisateur */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{userName}</span>
                          {userEmail && (
                            <>
                              <span>•</span>
                              <span className="truncate">{userEmail}</span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                              locale: fr,
                            }
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
