// frontend/components/modals/notification-modal.tsx
"use client";

import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: NotificationType;
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
}: NotificationModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  const Icon = icons[type];
  const colorClasses = colors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-md mx-4">
        <div className={`rounded-xl border ${colorClasses} p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Icon className={`h-8 w-8 ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm opacity-90">{message}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className={`${
                type === 'success' 
                  ? 'border-green-300 text-green-700 hover:bg-green-100' 
                  : type === 'error'
                  ? 'border-red-300 text-red-700 hover:bg-red-100'
                  : type === 'warning'
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}