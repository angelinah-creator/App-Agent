"use client";

import { useState } from "react";
import { X, UserCog, AlertTriangle } from "lucide-react";
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
import type { Agent, UserProfile } from "@/lib/users-service";

interface ChangeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onConfirm: (newProfile: UserProfile) => Promise<void>;
  isLoading: boolean;
}

export function ChangeProfileModal({
  isOpen,
  onClose,
  agent,
  onConfirm,
  isLoading,
}: ChangeProfileModalProps) {
  const [newProfile, setNewProfile] = useState<UserProfile | "">("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!newProfile) {
      alert("Veuillez sélectionner un nouveau profil");
      return;
    }

    if (newProfile === agent.profile) {
      alert("Le profil sélectionné est le meme que le profil actuel");
      return;
    }

    await onConfirm(newProfile as UserProfile);
  };

  // Déterminer les profils disponibles selon le profil actuel
  const getAvailableProfiles = () => {
    switch (agent.profile) {
      case "stagiaire":
        return [{ value: "admin", label: "Administrateur" }];
      case "prestataire":
        return [{ value: "admin", label: "Administrateur" }];
      case "admin":
        return [
          { value: "stagiaire", label: "Stagiaire" },
          { value: "prestataire", label: "Prestataire" },
        ];
      default:
        return [];
    }
  };

  const availableProfiles = getAvailableProfiles();

  const getProfileLabel = (profile: string) => {
    const labels: Record<string, string> = {
      stagiaire: "Stagiaire",
      prestataire: "Prestataire",
      admin: "Administrateur",
    };
    return labels[profile] || profile;
  };

  const getProfileColor = (profile: string) => {
    const colors: Record<string, string> = {
      stagiaire: "from-blue-100 to-cyan-100",
      prestataire: "from-purple-100 to-pink-100",
      admin: "from-violet-100 to-fuchsia-100",
    };
    return colors[profile] || "from-gray-100 to-slate-100";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg border-slate-200/50 animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-white/95 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg">
                <UserCog className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Changer le profil
                </h3>
                <p className="text-sm text-slate-600">
                  {agent.prenoms} {agent.nom}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Informations actuelles */}
          <div
            className={`p-4 bg-gradient-to-r ${getProfileColor(
              agent.profile
            )} rounded-xl border border-slate-200 mb-6`}
          >
            <h4 className="font-semibold text-slate-800 mb-2">Profil actuel</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800 capitalize">
                {getProfileLabel(agent.profile)}
              </span>
            </div>
          </div>

          {/* Sélection du nouveau profil */}
          <div className="space-y-4 mb-6">
            <div>
              <Label
                htmlFor="newProfile"
                className="text-slate-700 font-medium"
              >
                Nouveau profil <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newProfile}
                onValueChange={(value) => setNewProfile(value as UserProfile)}
              >
                <SelectTrigger className="mt-1.5 border-slate-300 focus:border-violet-500 focus:ring-violet-500">
                  <SelectValue placeholder="Sélectionnez un profil" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.value} value={profile.value}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newProfile && (
              <div
                className={`p-4 bg-gradient-to-r ${getProfileColor(
                  newProfile
                )} rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <h4 className="font-semibold text-slate-800 mb-1">
                  Apere§u du changement
                </h4>
                <p className="text-sm text-slate-700">
                  {getProfileLabel(agent.profile)} â†'{" "}
                  <strong>{getProfileLabel(newProfile)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Avertissement */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Attention</p>
              <p className="text-xs text-amber-700 mt-1">
                {agent.profile === "admin"
                  ? "Vous etes sur le point de rétrograder un administrateur. Cette action est irréversible."
                  : "Vous etes sur le point de promouvoir cet utilisateur en administrateur. Il aura acces e  toutes les fonctionnalités d'administration."}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !newProfile}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
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
