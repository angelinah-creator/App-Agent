// frontend/components/sections/absences-section-admin.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ValidateAbsenceModal } from "@/components/modals/validate-absence-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { absenceService, type Absence } from "@/lib/absence-service";
import type { UserData } from "@/lib/types";

export function AbsencesSectionAdmin() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validateAction, setValidateAction] = useState<
    "approve" | "reject" | null
  >(null);

  // Récupérer toutes les absences
  const { data: absences = [], isLoading } = useQuery({
    queryKey: ["absences-admin"],
    queryFn: absenceService.getAllAbsences,
  });

  // Mutation pour valider/rejeter une absence
  const validateMutation = useMutation({
    mutationFn: ({ absenceId, data }: { absenceId: string; data: any }) =>
      absenceService.updateAbsenceStatus(absenceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences-admin"] });
    },
    onError: (error: any) => {
      console.error("Erreur validation absence:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la validation de l'absence"
      );
    },
  });

  // Filtrage et tri
  const filteredAbsences = [...absences]
    .filter((absence) => {
      const agent =
        typeof absence.agentId === "object" ? absence.agentId : null;
      const matchesSearch =
        searchTerm === "" ||
        (agent && agent.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (agent &&
          agent.prenoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
        absence.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || absence.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getAgentName = (absence: Absence) => {
    if (
      typeof absence.agentId === "object" &&
      absence.agentId &&
      absence.agentId.nom
    ) {
      return `${absence.agentId.nom} ${absence.agentId.prenoms}`;
    }
    return "Agent inconnu";
  };

  const getAgentEmail = (absence: Absence) => {
    if (
      typeof absence.agentId === "object" &&
      absence.agentId &&
      absence.agentId.email
    ) {
      return absence.agentId.email;
    }
    return "Email non disponible";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: any; label: string }
    > = {
      pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: Clock,
        label: "En attente",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircle,
        label: "Approuvée",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: XCircle,
        label: "Rejetée",
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  const handleValidate = (absence: Absence, action: "approve" | "reject") => {
    setSelectedAbsence(absence);
    setValidateAction(action);
    setShowValidateModal(true);
  };

  const pendingCount = absences.filter((a) => a.status === "pending").length;
  const approvedCount = absences.filter((a) => a.status === "approved").length;
  const rejectedCount = absences.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {filteredAbsences.length} demande
            {filteredAbsences.length > 1 ? "s" : ""} trouvée
            {filteredAbsences.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-600">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-slate-600">Approuvées</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-slate-600">Rejetées</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par agent ou raison..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des absences */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
        </div>
      ) : filteredAbsences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucune demande d'absence trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAbsences.map((absence) => (
            <Card
              key={absence._id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${
                        absence.status === "pending"
                          ? "bg-gradient-to-br from-amber-100 to-orange-100"
                          : absence.status === "approved"
                          ? "bg-gradient-to-br from-green-100 to-emerald-100"
                          : "bg-gradient-to-br from-red-100 to-rose-100"
                      }`}
                    >
                      <Calendar
                        className={`w-6 h-6 ${
                          absence.status === "pending"
                            ? "text-amber-600"
                            : absence.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <h3 className="font-semibold text-lg text-slate-800">
                            {getAgentName(absence)}
                          </h3>
                        </div>
                        {getStatusBadge(absence.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-slate-500">Email:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {getAgentEmail(absence)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Durée:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {calculateDuration(
                              absence.startDate,
                              absence.endDate
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Du:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {formatDate(absence.startDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Au:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {formatDate(absence.endDate)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500">Raison:</span>
                          <p className="mt-1 font-medium text-slate-800">
                            {absence.reason}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500">
                            Personne de backup:
                          </span>
                          <span className="ml-2 font-medium text-slate-800">
                            {absence.backupPerson}
                          </span>
                        </div>
                        {absence.adminReason && (
                          <div className="col-span-2">
                            <span className="text-slate-500">
                              {absence.status === "approved"
                                ? "Message"
                                : "Raison du rejet"}
                              :
                            </span>
                            <p
                              className={`mt-1 font-medium ${
                                absence.status === "approved"
                                  ? "text-green-600"
                                  : "text-red-600"
                              } italic`}
                            >
                              {absence.adminReason}
                            </p>
                          </div>
                        )}
                        {absence.validatedAt && (
                          <div>
                            <span className="text-slate-500">Validée le:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatDate(absence.validatedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {absence.status === "pending" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(absence, "approve")}
                        disabled={validateMutation.isPending}
                        className="hover:bg-green-50 hover:border-green-300 text-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(absence, "reject")}
                        disabled={validateMutation.isPending}
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de validation */}
      {selectedAbsence && validateAction && (
        <ValidateAbsenceModal
          isOpen={showValidateModal}
          onClose={() => {
            setShowValidateModal(false);
            setSelectedAbsence(null);
            setValidateAction(null);
          }}
          absence={selectedAbsence}
          actionType={validateAction}
          onValidate={(data) => {
            validateMutation.mutate(
              { absenceId: selectedAbsence._id, data },
              {
                onSuccess: () => {
                  setShowValidateModal(false);
                  setSelectedAbsence(null);
                  setValidateAction(null);
                },
              }
            );
          }}
          isLoading={validateMutation.isPending}
        />
      )}
    </div>
  );
}
