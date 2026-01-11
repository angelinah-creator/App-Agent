"use client";

import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent, UserRole } from "@/lib/users-service";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onConfirm: (newRole: UserRole) => Promise<void>;
  isLoading: boolean;
}

export function ChangeRoleModal({
  isOpen,
  onClose,
  agent,
  onConfirm,
  isLoading,
}: ChangeRoleModalProps) {
  const [newRole, setNewRole] = useState<UserRole | "">("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!newRole) {
      alert("Veuillez sélectionner un nouveau rôle");
      return;
    }

    if (newRole === agent.role) {
      alert("Le rôle sélectionné est le même que le rôle actuel");
      return;
    }

    await onConfirm(newRole);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrateur",
      manager: "Manager",
      collaborateur: "Collaborateur",
      client: "Client",
    };
    return labels[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-slate-200/50 animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-white/95 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Changer le rôle
                </h3>
                <p className="text-sm text-slate-600">
                  {agent.prenoms} {agent.nom}
                </p>
              </div>
            </div>
          </div>

          {/* Rôle actuel */}
          <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border border-slate-300 mb-6">
            <h4 className="font-semibold text-slate-800 mb-2">Rôle actuel</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800 capitalize">
                {getRoleLabel(agent.role)}
              </span>
            </div>
          </div>

          {/* Sélection du nouveau rôle */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="newRole" className="text-slate-700 font-medium">
                Nouveau rôle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as UserRole)}
              >
                <SelectTrigger className="mt-1.5 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="collaborateur">Collaborateur</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Avertissement */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Attention</p>
              <p className="text-xs text-amber-700 mt-1">
                Le changement de rôle affecte les permissions d'accès de l'utilisateur.
                Cette action est réversible.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !newRole}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Modification...
                </>
              ) : (
                "Confirmer le changement"
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 transition-all duration-200 bg-transparent"
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}