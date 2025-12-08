"use client";

import type React from "react";
import { useState } from "react";
import {
  Eye,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  X,
  Users,
  FileText,
  Plus,
  Edit,
  Archive,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  Agent,
  CreateAgentDto,
  Genre,
  UserProfile,
} from "@/lib/users-service";
import { usersService } from "@/lib/users-service";
import { ChangeProfileModal } from "@/components/modals/change-profile-modal";

interface AgentsSectionProps {
  agents: Agent[];
  agentsLoading: boolean;
  stats?: any;
  onArchiveAgent: (agentId: string, archiveReason?: string) => void;
  onRestoreAgent: (agentId: string) => void;
  archiveAgentPending: boolean;
  onAgentCreated?: () => void;
  onAgentProfileChanged?: () => void;
  showArchived: boolean;
  onToggleArchived: (show: boolean) => void;
}

export function AgentsSection({
  agents,
  agentsLoading,
  stats,
  onArchiveAgent,
  onRestoreAgent,
  archiveAgentPending,
  onAgentCreated,
  showArchived,
  onToggleArchived,
}: AgentsSectionProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [filterProfile, setFilterProfile] = useState<
    "all" | "stagiaire" | "prestataire"
  >("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showChangeProfileModal, setShowChangeProfileModal] = useState(false);
  const [agentToChangeProfile, setAgentToChangeProfile] =
    useState<Agent | null>(null);
  const [isChangingProfile, setIsChangingProfile] = useState(false);

  const [formData, setFormData] = useState<CreateAgentDto>({
    profile: "stagiaire" as UserProfile,
    nom: "",
    prenoms: "",
    dateNaissance: "",
    genre: "Homme" as Genre,
    adresse: "",
    cin: "",
    poste: "",
    dateDebut: "",
    dateFinIndeterminee: false,
    tjm: 0,
    telephone: "",
    email: "",
    password: "",
  });

  const [editFormData, setEditFormData] = useState<any>({});

  // Calculer les statistiques locales
  const activeAgents = agents.filter((agent) => !agent.archived);
  const archivedAgents = agents.filter((agent) => agent.archived);

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetailsModal(true);
  };

  const handleChangeProfile = (agent: Agent) => {
    setAgentToChangeProfile(agent);
    setShowChangeProfileModal(true);
  };

  const handleConfirmProfileChange = async (newProfile: UserProfile) => {
    if (!agentToChangeProfile) return;

    setIsChangingProfile(true);
    try {
      await usersService.changeUserProfile(
        agentToChangeProfile._id,
        newProfile
      );
      setShowChangeProfileModal(false);
      setAgentToChangeProfile(null);
      onAgentCreated?.();
    } catch (error: any) {
      console.error("Erreur changement profil:", error);
      alert(error.message || "Erreur lors du changement de profil");
    } finally {
      setIsChangingProfile(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);

    // Formater correctement les dates pour le backend
    const formattedData: any = {
      nom: agent.nom || "",
      prenoms: agent.prenoms || "",
      email: agent.email || "",
      telephone: agent.telephone || "",
      adresse: agent.adresse || "",
      poste: agent.poste || "",
      dateDebut: agent.dateDebut, // Garder le format ISO original
      dateFinIndeterminee: Boolean(agent.dateFinIndeterminee),
    };

    // Formater dateFin si elle existe
    if (agent.dateFin && agent.dateFin.trim() !== "") {
      // S'assurer que c'est au format ISO
      let dateFinValue = agent.dateFin;
      if (!dateFinValue.includes("T")) {
        dateFinValue = `${dateFinValue}T00:00:00.000Z`;
      }
      formattedData.dateFin = dateFinValue;
    } else {
      // Si pas de dateFin, envoyer null
      formattedData.dateFin = null;
    }

    // Champs optionnels
    if (agent.mission) formattedData.mission = agent.mission;
    if (agent.domainePrestation)
      formattedData.domainePrestation = agent.domainePrestation;

    // Champs numériques
    if (agent.profile === "stagiaire") {
      if (agent.indemnite !== undefined)
        formattedData.indemnite = Number(agent.indemnite);
      if (agent.indemniteConnexion !== undefined)
        formattedData.indemniteConnexion = Number(agent.indemniteConnexion);
    } else if (agent.profile === "prestataire") {
      if (agent.tjm !== undefined) formattedData.tjm = Number(agent.tjm);
      if (agent.tarifJournalier !== undefined)
        formattedData.tarifJournalier = Number(agent.tarifJournalier);
      if (agent.dureeJournaliere !== undefined)
        formattedData.dureeJournaliere = Number(agent.dureeJournaliere);
    }

    console.log("📝 Données formatées pour modification:", formattedData);
    setEditFormData(formattedData);
    setShowEditModal(true);
  };

  const handleArchive = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowArchiveModal(true);
  };

  const handleConfirmArchive = () => {
    if (selectedAgent) {
      onArchiveAgent(selectedAgent._id, archiveReason);
      setShowArchiveModal(false);
      setArchiveReason("");
      setSelectedAgent(null);
    }
  };

  const handleRestore = (agent: Agent) => {
    onRestoreAgent(agent._id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await usersService.createAgent(formData);
      setShowAddModal(false);
      setFormData({
        profile: "stagiaire" as UserProfile,
        nom: "",
        prenoms: "",
        dateNaissance: "",
        genre: "Homme" as Genre,
        adresse: "",
        cin: "",
        poste: "",
        dateDebut: "",
        dateFinIndeterminee: false,
        tjm: 0,
        telephone: "",
        email: "",
        password: "",
      });
      onAgentCreated?.();
    } catch (error) {
      console.error("Erreur lors de la création de l'agent:", error);
      alert("Erreur lors de la création de l'agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("🚀 Début modification...");

    try {
      if (selectedAgent) {
        console.log("ID agent:", selectedAgent._id);
        console.log("Données à envoyer:", editFormData);

        const result = await usersService.updateAgent(
          selectedAgent._id,
          editFormData
        );
        console.log("✅ Modification réussie:", result);

        setShowEditModal(false);
        onAgentCreated?.();
      }
    } catch (error) {
      console.error("❌ Erreur modification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les agents selon le statut d'archivage et le profil
  const filteredAgents = agents.filter((agent) => {
    // Filtre par statut d'archivage
    if (showArchived && !agent.archived) return false;
    if (!showArchived && agent.archived) return false;

    // Filtre par profil
    if (filterProfile === "all") return true;
    return agent.profile === filterProfile;
  });

  return (
    <>
      {/* Stats Cards mises à jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-violet-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Agents
            </CardTitle>
            <Users className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {agents.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {activeAgents.length} actifs, {archivedAgents.length} archivés
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stagiaires
            </CardTitle>
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              
              {" "}
              {activeAgents.filter((a) => a.profile === "stagiaire").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prestataires
            </CardTitle>
            <div className="w-3 h-3 bg-green-600 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              
              {" "}
              {activeAgents.filter((a) => a.profile === "prestataire").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agents actifs et archivés
            </CardTitle>
            <Users className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>
                Actifs: {activeAgents.length}
              </p>
              <p>
                Archivés: {archivedAgents.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles de filtrage */}
      <Card className="border-violet-200 bg-white/80 backdrop-blur-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={!showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleArchived(false)}
                className={
                  !showArchived
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                    : "border-violet-300 hover:bg-violet-50"
                }
              >
                <Users size={16} className="mr-2" />
                Agents Actifs ({activeAgents.length})
              </Button>
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleArchived(true)}
                className={
                  showArchived
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-50"
                }
              >
                <Archive size={16} className="mr-2" />
                Agents Archivés ({archivedAgents.length})
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterProfile === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterProfile("all")}
                className={
                  filterProfile === "all"
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                    : "border-violet-300 hover:bg-violet-50"
                }
              >
                Tous
              </Button>
              <Button
                variant={filterProfile === "stagiaire" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterProfile("stagiaire")}
                className={
                  filterProfile === "stagiaire"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-blue-300 hover:bg-blue-50"
                }
              >
                Stagiaires
              </Button>
              <Button
                variant={
                  filterProfile === "prestataire" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setFilterProfile("prestataire")}
                className={
                  filterProfile === "prestataire"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-emerald-300 hover:bg-emerald-50"
                }
              >
                Prestataires
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des agents */}
      <Card className="border-violet-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {showArchived ? "Agents Archivés" : "Agents Actifs"}
              </CardTitle>
              <CardDescription>
                {showArchived
                  ? "Liste des agents archivés - Ces agents ne sont plus actifs"
                  : "Gérez vos stagiaires et prestataires actifs"}
              </CardDescription>
            </div>
            {!showArchived && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
              >
                <Plus size={16} className="mr-2" />
                Ajouter agent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {showArchived
                ? "Aucun agent archivé trouvé"
                : "Aucun agent trouvé"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
                  <tr className="border-b border-violet-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                      Agent
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                      Profil
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                      Contact
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                      Poste
                    </th>
                    {showArchived && (
                      <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                        Archivé le
                      </th>
                    )}
                    <th className="text-left py-4 px-4 text-sm font-semibold text-violet-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr
                      key={agent._id}
                      className={`border-b transition-colors ${
                        agent.archived
                          ? "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200"
                          : "hover:bg-violet-50/50 border-violet-100"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              agent.archived
                                ? "bg-gray-400"
                                : agent.profile === "stagiaire"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                            }`}
                            title={
                              agent.archived
                                ? "Archivé"
                                : agent.profile === "stagiaire"
                                ? "Stagiaire"
                                : "Prestataire"
                            }
                          />
                          <div>
                            <p
                              className={`font-semibold ${
                                agent.archived
                                  ? "text-gray-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {agent.prenoms} {agent.nom}
                            </p>
                            <p
                              className={`text-sm ${
                                agent.archived
                                  ? "text-gray-500"
                                  : "text-gray-600"
                              }`}
                            >
                              {agent.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            agent.archived
                              ? "bg-gray-100 text-gray-800"
                              : agent.profile === "stagiaire"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {agent.profile}
                          {agent.archived && " (archivé)"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className={`text-sm ${
                            agent.archived ? "text-gray-500" : "text-gray-600"
                          }`}
                        >
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {agent.telephone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p
                          className={`text-sm ${
                            agent.archived ? "text-gray-600" : "text-gray-800"
                          }`}
                        >
                          {agent.poste}
                        </p>
                      </td>
                      {showArchived && (
                        <td className="py-4 px-4">
                          <p className="text-sm text-gray-600">
                            {agent.archivedAt
                              ? new Date(agent.archivedAt).toLocaleDateString(
                                  "fr-FR"
                                )
                              : "N/A"}
                          </p>
                          {agent.archiveReason && (
                            <p className="text-xs text-gray-500 mt-1">
                              {agent.archiveReason}
                            </p>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {!agent.archived ? (
                            // Actions pour les agents actifs
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChangeProfile(agent)}
                                className="border-purple-300 hover:bg-purple-600 hover:text-white"
                                title="Changer le profil"
                              >
                                <RefreshCw size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(agent)}
                                className="border-violet-300 hover:bg-violet-300"
                              >
                                <Eye size={14} className="mr-1" />
                                Détails
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(agent)}
                                className="border-blue-300 hover:bg-blue-600 hover:text-white"
                              >
                                <Edit size={14} />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArchive(agent)}
                                className="border-orange-300 hover:bg-orange-600 hover:text-white"
                                disabled={archiveAgentPending}
                              >
                                <Archive size={14} />
                                Archiver
                              </Button>
                            </>
                          ) : (
                            // Actions pour les agents archivés
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(agent)}
                                className="border-violet-300 hover:bg-violet-300"
                              >
                                <Eye size={14} className="mr-1" />
                                Détails
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(agent)}
                                className="border-green-300 hover:bg-green-600 hover:text-white"
                                disabled={archiveAgentPending}
                              >
                                <RefreshCw size={14} className="mr-1" />
                                Restaurer
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmation d'archivage */}
      {showArchiveModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Archiver l'agent</h2>
              <p className="text-orange-100 mt-1">
                Êtes-vous sûr de vouloir archiver {selectedAgent.prenoms}{" "}
                {selectedAgent.nom} ?
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label
                  htmlFor="archiveReason"
                  className="text-sm font-medium text-gray-700"
                >
                  Raison de l'archivage (optionnel)
                </Label>
                <Input
                  id="archiveReason"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="Ex: Fin de contrat, départ..."
                  className="mt-1"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-amber-600 text-xs">!</span>
                  </div>
                  <div className="text-amber-800 text-sm">
                    <p className="font-medium">Information</p>
                    <p className="mt-1">
                      L'agent sera marqué comme archivé et ne sera plus visible
                      dans la liste des agents actifs. Toutes ses données
                      seront conservées.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveReason("");
                  setSelectedAgent(null);
                }}
                className="flex-1"
                disabled={archiveAgentPending}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleConfirmArchive}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                disabled={archiveAgentPending}
              >
                {archiveAgentPending ? "Archivage..." : "Confirmer l'archivage"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Ajouter un agent</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
                className="hover:bg-white/20 text-white"
              >
                <X size={24} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations de base */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations de base
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile">Profil *</Label>
                    <Select
                      value={formData.profile}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          profile: value as UserProfile,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stagiaire">Stagiaire</SelectItem>
                        <SelectItem value="prestataire">Prestataire</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenoms">Prénoms *</Label>
                    <Input
                      id="prenoms"
                      value={formData.prenoms}
                      onChange={(e) =>
                        setFormData({ ...formData, prenoms: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="genre">Genre *</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) =>
                        setFormData({ ...formData, genre: value as Genre })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Homme">Homme</SelectItem>
                        <SelectItem value="Femme">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateNaissance">Date de naissance *</Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateNaissance: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cin">CIN *</Label>
                    <Input
                      id="cin"
                      value={formData.cin}
                      onChange={(e) =>
                        setFormData({ ...formData, cin: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone *</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="adresse">Adresse *</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations professionnelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="poste">Poste *</Label>
                    <Input
                      id="poste"
                      value={formData.poste}
                      onChange={(e) =>
                        setFormData({ ...formData, poste: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mission">Mission</Label>
                    <Input
                      id="mission"
                      value={formData.mission || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, mission: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateDebut">Date de début *</Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) =>
                        setFormData({ ...formData, dateDebut: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateFin">Date de fin</Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={formData.dateFin || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, dateFin: e.target.value })
                      }
                      disabled={formData.dateFinIndeterminee}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      id="dateFinIndeterminee"
                      checked={formData.dateFinIndeterminee}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          dateFinIndeterminee: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="dateFinIndeterminee"
                      className="cursor-pointer"
                    >
                      Date de fin indéterminée
                    </Label>
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations financières
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {formData.profile === "stagiaire" ? (
                    <>
                      <div>
                        <Label htmlFor="indemnite">Indemnité mensuelle</Label>
                        <Input
                          id="indemnite"
                          type="number"
                          value={formData.indemnite || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              indemnite: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="indemniteConnexion">
                          Indemnité de connexion
                        </Label>
                        <Input
                          id="indemniteConnexion"
                          type="number"
                          value={formData.indemniteConnexion || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              indemniteConnexion: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="tjm">
                          TJM (Taux Journalier Moyen) *
                        </Label>
                        <Input
                          id="tjm"
                          type="number"
                          value={formData.tjm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tjm: Number(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tarifJournalier">
                          Tarif journalier
                        </Label>
                        <Input
                          id="tarifJournalier"
                          type="number"
                          value={formData.tarifJournalier || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tarifJournalier: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="dureeJournaliere">
                          Durée journalière (heures)
                        </Label>
                        <Input
                          id="dureeJournaliere"
                          type="number"
                          value={formData.dureeJournaliere || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dureeJournaliere: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="domainePrestation">
                          Domaine de prestation
                        </Label>
                        <Input
                          id="domainePrestation"
                          value={formData.domainePrestation || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              domainePrestation: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Création..." : "Créer l'agent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Modifier {selectedAgent.prenoms} {selectedAgent.nom}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
                className="hover:bg-white/20 text-white"
              >
                <X size={24} />
              </Button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Informations de base */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations de base
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nom">Nom *</Label>
                    <Input
                      id="edit-nom"
                      value={editFormData.nom || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          nom: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prenoms">Prénoms *</Label>
                    <Input
                      id="edit-prenoms"
                      value={editFormData.prenoms || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          prenoms: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telephone">Téléphone *</Label>
                    <Input
                      id="edit-telephone"
                      value={editFormData.telephone || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          telephone: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-adresse">Adresse *</Label>
                    <Input
                      id="edit-adresse"
                      value={editFormData.adresse || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          adresse: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations professionnelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-poste">Poste *</Label>
                    <Input
                      id="edit-poste"
                      value={editFormData.poste || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          poste: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-mission">Mission</Label>
                    <Input
                      id="edit-mission"
                      value={editFormData.mission || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          mission: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-dateDebut">Date de début *</Label>
                    <Input
                      id="edit-dateDebut"
                      type="date"
                      value={editFormData.dateDebut?.split("T")[0] || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          dateDebut: e.target.value
                            ? `${e.target.value}T00:00:00.000Z`
                            : "",
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-dateFin">Date de fin</Label>
                    <Input
                      id="edit-dateFin"
                      type="date"
                      value={editFormData.dateFin?.split("T")[0] || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          dateFin: e.target.value
                            ? `${e.target.value}T00:00:00.000Z`
                            : null,
                        })
                      }
                      disabled={editFormData.dateFinIndeterminee}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      id="edit-dateFinIndeterminee"
                      checked={editFormData.dateFinIndeterminee || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({
                          ...editFormData,
                          dateFinIndeterminee: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="edit-dateFinIndeterminee"
                      className="cursor-pointer"
                    >
                      Date de fin indéterminée
                    </Label>
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations financières
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAgent.profile === "stagiaire" ? (
                    <>
                      <div>
                        <Label htmlFor="edit-indemnite">
                          Indemnité mensuelle
                        </Label>
                        <Input
                          id="edit-indemnite"
                          type="number"
                          value={editFormData.indemnite || 0}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              indemnite: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-indemniteConnexion">
                          Indemnité de connexion
                        </Label>
                        <Input
                          id="edit-indemniteConnexion"
                          type="number"
                          value={editFormData.indemniteConnexion || 0}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              indemniteConnexion: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="edit-tjm">
                          TJM (Taux Journalier Moyen) *
                        </Label>
                        <Input
                          id="edit-tjm"
                          type="number"
                          value={editFormData.tjm || 0}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              tjm: Number(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-tarifJournalier">
                          Tarif journalier
                        </Label>
                        <Input
                          id="edit-tarifJournalier"
                          type="number"
                          value={editFormData.tarifJournalier || 0}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              tarifJournalier: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-dureeJournaliere">
                          Durée journalière (heures)
                        </Label>
                        <Input
                          id="edit-dureeJournaliere"
                          type="number"
                          value={editFormData.dureeJournaliere || 0}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              dureeJournaliere: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-domainePrestation">
                          Domaine de prestation
                        </Label>
                        <Input
                          id="edit-domainePrestation"
                          value={editFormData.domainePrestation || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              domainePrestation: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Modification..." : "Modifier l'agent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div
              className={`sticky top-0 text-white p-6 rounded-t-2xl flex items-center justify-between ${
                selectedAgent.archived
                  ? "bg-gradient-to-r from-gray-600 to-gray-500"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600"
              }`}
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedAgent.prenoms} {selectedAgent.nom}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedAgent.archived
                        ? "bg-gray-300"
                        : selectedAgent.profile === "stagiaire"
                        ? "bg-blue-300"
                        : "bg-emerald-300"
                    }`}
                  />
                  <span className="text-sm capitalize">
                    {selectedAgent.profile}
                    {selectedAgent.archived && " (archivé)"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetailsModal(false)}
                className="hover:bg-white/20 text-white"
              >
                <X size={24} />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {selectedAgent.archived && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-gray-600 text-xs">!</span>
                    </div>
                    <div className="text-gray-700 text-sm">
                      <p className="font-medium">Agent archivé</p>
                      <p className="mt-1">
                        Cet agent a été archivé le{" "}
                        {selectedAgent.archivedAt
                          ? new Date(
                              selectedAgent.archivedAt
                            ).toLocaleDateString("fr-FR")
                          : "N/A"}
                        {selectedAgent.archiveReason &&
                          ` - Raison: ${selectedAgent.archiveReason}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={20} className="text-violet-600" />
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.telephone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">CIN</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.cin}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date de naissance</p>
                    <p className="font-medium text-gray-900">
                      {new Date(
                        selectedAgent.dateNaissance
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Genre</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.genre}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Adresse</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.adresse}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase size={20} className="text-violet-600" />
                  Informations Professionnelles
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Poste</p>
                    <p className="font-medium text-gray-900">
                      {selectedAgent.poste}
                    </p>
                  </div>
                  {selectedAgent.mission && (
                    <div>
                      <p className="text-gray-600">Mission</p>
                      <p className="font-medium text-gray-900">
                        {selectedAgent.mission}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Date de début</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedAgent.dateDebut).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </div>
                  {selectedAgent.dateFin &&
                    !selectedAgent.dateFinIndeterminee && (
                      <div>
                        <p className="text-gray-600">Date de fin</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedAgent.dateFin).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Informations financières */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-violet-600" />
                  Informations Financières
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedAgent.profile === "stagiaire" ? (
                    <>
                      <div>
                        <p className="text-gray-600">Indemnité mensuelle</p>
                        <p className="font-medium text-gray-900">
                          {selectedAgent.indemnite || 0} Ar
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Indemnité de connexion</p>
                        <p className="font-medium text-gray-900">
                          {selectedAgent.indemniteConnexion || 0} Ar
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-600">
                          TJM (Taux Journalier Moyen)
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedAgent.tjm} Ar
                        </p>
                      </div>
                      {selectedAgent.tarifJournalier && (
                        <div>
                          <p className="text-gray-600">Tarif journalier</p>
                          <p className="font-medium text-gray-900">
                            {selectedAgent.tarifJournalier} Ar
                          </p>
                        </div>
                      )}
                      {selectedAgent.dureeJournaliere && (
                        <div>
                          <p className="text-gray-600">Durée journalière</p>
                          <p className="font-medium text-gray-900">
                            {selectedAgent.dureeJournaliere}h
                          </p>
                        </div>
                      )}
                      {selectedAgent.domainePrestation && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Domaine de prestation</p>
                          <p className="font-medium text-gray-900">
                            {selectedAgent.domainePrestation}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  className={`flex-1 ${
                    selectedAgent.archived
                      ? "bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400"
                      : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                  }`}
                >
                  Fermer
                </Button>
                {!selectedAgent.archived && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedAgent)}
                      className="border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit size={16} className="mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleArchive(selectedAgent);
                      }}
                      className="border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <Archive size={16} className="mr-2" />
                      Archiver
                    </Button>
                  </>
                )}
                {selectedAgent.archived && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRestore(selectedAgent);
                    }}
                    className="border-green-300 hover:bg-green-50 hover:text-green-600"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Restaurer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de changement de profil */}
      {agentToChangeProfile && (
        <ChangeProfileModal
          isOpen={showChangeProfileModal}
          onClose={() => {
            setShowChangeProfileModal(false);
            setAgentToChangeProfile(null);
          }}
          agent={agentToChangeProfile}
          onConfirm={handleConfirmProfileChange}
          isLoading={isChangingProfile}
        />
      )}
    </>
  );
}