"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Supprimer cette tâche ?",
  description = "Cette action est irréversible. La tâche sera définitivement supprimée.",
  confirmText = "Supprimer",
  cancelText = "Annuler",
}: DeleteConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-[#1a1a1d] border-gray-800 text-gray-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="bg-gray-700 hover:bg-gray-600 border-none text-white transition">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white transition border-none"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
