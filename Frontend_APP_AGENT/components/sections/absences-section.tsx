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
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
          "Erreur lors de la création de la demande"
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
          "Erreur lors de la suppression de la demande"
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
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
    <div className="space-y-6">
      {dialog}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucune demande d'absence</p>
              <Button
                variant="outline"
                className="mt-4 border-violet-600 text-violet-600 hover:bg-violet-50 bg-transparent"
                onClick={() => setShowCreateDialog(true)}
              >
                Créer votre première demande
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {absences.map((absence) => (
                <div
                  key={absence._id}
                  className="border rounded-lg p-4 hover:bg-violet-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0",
                          getStatusColor(absence.status)
                        )}
                      />
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatDate(absence.startDate)} →{" "}
                          {formatDate(absence.endDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {absence.duration} jours
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(absence.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Raison
                        </p>
                        <p className="text-sm">{absence.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Personne de remplacement
                        </p>
                        <p className="text-sm">{absence.backupPerson}</p>
                      </div>
                    </div>
                  </div>

                  {absence.adminReason && (
                    <div
                      className={`p-3 rounded mb-3 ${
                        absence.status === "approved"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
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
                        className="text-destructive hover:text-destructive"
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle demande d'absence</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour votre demande de congé
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="backupPerson">Personne de remplacement</Label>
              <Input
                id="backupPerson"
                placeholder="Nom de la personne qui vous remplacera"
                value={formData.backupPerson}
                onChange={(e) =>
                  setFormData({ ...formData, backupPerson: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="reason">Raison de l'absence</Label>
              <Textarea
                id="reason"
                placeholder="Expliquez la raison de votre demande..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="min-h-24 resize-y max-h-48 max-w-md"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createAbsenceMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {createAbsenceMutation.isPending
                ? "Envoi en cours..."
                : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
