"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { absenceService, type CreateAbsenceDto } from "@/lib/absence-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  FileText,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";

export function AbsencesSection() {
  const { confirm, dialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateAbsenceDto>({
    startDate: "",
    endDate: "",
    reason: "",
    backupPerson: "",
  });

  const {
    data: absences = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-absences"],
    queryFn: () => absenceService.getMyAbsences(),
    select: (data) =>
      [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  });

  const createAbsenceMutation = useMutation({
    mutationFn: (data: CreateAbsenceDto) => {
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      console.log("[v0] Sending absence data:", formattedData);
      return absenceService.createAbsence(formattedData);
    },
    onSuccess: async () => {
      // Invalider et recharger
      await queryClient.invalidateQueries({ queryKey: ["my-absences"] });
      await queryClient.invalidateQueries({ queryKey: ["absences-admin"] });

      // Forcer le rechargement immÃ©diat
      await queryClient.refetchQueries({ queryKey: ["my-absences"] });
      await queryClient.refetchQueries({ queryKey: ["absences-admin"] });

      // Fermer le dialog et rÃ©initialiser
      setShowCreateDialog(false);
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        backupPerson: "",
      });
      setShowCreateDialog(false);
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        backupPerson: "",
      });
    },
    onError: (error: any) => {
      console.error("[v0] Erreur création absence:", error);
      console.error("[v0] Error response:", error.response?.data);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la création de la demande",
      );
    },
  });

  const deleteAbsenceMutation = useMutation({
    mutationFn: (absenceId: string) => absenceService.deleteAbsence(absenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-absences"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression absence:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la suppression de la demande",
      );
    },
  });

  const handleSubmit = () => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason ||
      !formData.backupPerson
    ) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      alert("La date de fin doit être après la date de début");
      return;
    }

    createAbsenceMutation.mutate(formData);
  };

  const handleDelete = (absenceId: string) => {
    confirm({
      title: "Supprimer cette demande",
      description: "Êtes-vous sûr de vouloir supprimer cette demande ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteAbsenceMutation.mutate(absenceId);
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approuvée</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejetée</Badge>;
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-4 border-violet-200 border-t-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Erreur lors du chargement de vos absences</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 -mt-8">
      {dialog}
      <Card className="bg-[#1F2128] border-[#313442]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </CardHeader>
        <CardContent className="border-[#313442]">
          {absences.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">
                Aucune demande d'absence
              </p>
              <Button
                variant="outline"
                className="mt-4 border-violet-600 text-violet-600 hover:bg-violet-50 bg-transparent"
                onClick={() => setShowCreateDialog(true)}
              >
                Créer votre première demande
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {absences.map((absence) => (
                <div
                  key={absence._id}
                  className="border border-[#313442] rounded-lg p-3 bg-[#303237] text-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0",
                          getStatusColor(absence.status),
                        )}
                      />
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {formatDate(absence.startDate)} →{" "}
                          {formatDate(absence.endDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {absence.duration} jours
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(absence.status)}
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Raison
                        </p>
                        <p className="text-xs">{absence.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Personne de remplacement
                        </p>
                        <p className="text-xs">{absence.backupPerson}</p>
                      </div>
                    </div>
                  </div>

                  {absence.adminReason && (
                    <div
                      className={`p-2 rounded mb-2 ${
                        absence.status === "approved"
                          ? "bg-green-200 border border-green-200"
                          : "bg-red-200 border border-red-200"
                      }`}
                    >
                      <p
                        className={`text-xs font-medium mb-1 ${
                          absence.status === "approved"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {absence.status === "approved"
                          ? "Message de l'admin"
                          : "Raison du rejet"}
                      </p>
                      <p
                        className={`text-sm ${
                          absence.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {absence.adminReason}
                      </p>
                    </div>
                  )}

                  {absence.status === "pending" && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(absence._id)}
                        disabled={deleteAbsenceMutation.isPending}
                        className="text-xs border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remplacer le bloc <Dialog> par ce code personnalisé */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-[#1F2128] backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Nouvelle demande d'absence
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Remplissez les informations pour votre demande de congé
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-1.5 block">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-2.5 rounded-lg outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium mb-1.5 block">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-2.5 rounded-lg outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-1.5 block">
                    Personne de remplacement
                  </label>
                  <input
                    type="text"
                    placeholder="Nom de votre remplaçant"
                    value={formData.backupPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, backupPerson: e.target.value })
                    }
                    className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-2.5 rounded-lg outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-1.5 block">
                    Raison de l'absence
                  </label>
                  <textarea
                    placeholder="Détaillez le motif..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={4}
                    className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-2.5 rounded-lg outline-none transition-colors resize-none min-h-[100px] placeholder:text-slate-600"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={createAbsenceMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-slate-50 text-white hover:text-blue-600 transition-all duration-300 hover:scale-105"
                  >
                    {createAbsenceMutation.isPending ? "Envoi..." : "Envoyer"}
                  </Button>
                  <Button
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1 text-white hover:text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all duration-200 bg-transparent hover:scale-105"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
