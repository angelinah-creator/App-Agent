// frontend/app/home/page.tsx
"use client";

import type React from "react";
import { act, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { authService } from "@/lib/auth-service";
import { contractService, type Contract } from "@/lib/contract-service";
import { documentService, type Document } from "@/lib/document-service";
import { invoiceService, type Invoice } from "@/lib/invoice-service";
import { kpiService, type KPI } from "@/lib/kpi-service";
import { usersService } from "@/lib/users-service";
import type { UserData } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DocumentsSection } from "@/components/sections/documents-section";
import { FacturesSection } from "@/components/sections/factures-section";
import { FacturesSectionAdmin } from "@/components/sections/factures-section-admin";
import { KPIsSection } from "@/components/sections/kpis-section";
import { ProfilSection } from "@/components/sections/profil-section";
import { AbsencesSection } from "@/components/sections/absences-section";
import { VideoSection } from "@/components/sections/video-section";
import { VideoSectionAdmin } from "@/components/sections/video-section-admin";
import { DashboardSection } from "@/components/sections/dashboard-section";

import { TachesSection } from "@/components/sections/taches-section";
import { EspacesPartageSection } from "@/components/sections/espaces_partage-section";
import { EspacesCollaboSection } from "@/components/sections/espaces_collabo-section";

import { AbsencesSectionAdmin } from "@/components/sections/absences-section-admin";
import { AgentsSection } from "@/components/sections/agents-section";
import { ContractsSectionAdmin } from "@/components/sections/contracts-section-admin";
import { DocumentsSectionAdmin } from "@/components/sections/documents-section-admin";
import { UploadDocumentModal } from "@/components/modals/upload-document-modal";
import { UploadKPIModal } from "@/components/modals/upload-kpi-modal";
import { KPIsSectionAdmin } from "@/components/sections/kpis-section-admin";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";

import { TimerSection } from "@/components/sections/timer-section";
import { RapportSection } from "@/components/sections/rapport-section";
import { RapportCollaboSection } from "@/components/sections/rapport_collabo-section";
import { api } from "@/lib/api-config";

function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("documents");
  const [isMounted, setIsMounted] = useState(false);
  const [showArchivedAgents, setShowArchivedAgents] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  // Document upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState<any>({
    type: "cin_recto",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // KPI upload state
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [kpiUploadData, setKPIUploadData] = useState<any>({
    type: "rapport_mensuel",
    periode: new Date().toISOString().split("T")[0].substring(0, 7),
    description: "",
  });
  const [selectedKPIFile, setSelectedKPIFile] = useState<File | null>(null);

  const isAdmin = userData?.role === "admin";
  const isManager = userData?.role === "manager";
  const isCollaborateur = userData?.role === "collaborateur";
  const isClient = userData?.role === "client";

  useEffect(() => {
    if (userData) {
      if (isAdmin) {
        setActiveSection("agents");
      } else if (isCollaborateur) {
        setActiveSection("dashboard");
      } else if (isManager) {
        setActiveSection("tableau_de_bord")
      } else if (isClient){
        setActiveSection("profil");
      }
    }
  }, [userData, isAdmin, isCollaborateur]);

  const getHeaderContent = () => {
    if (isAdmin) {
      const adminHeaderMap: {
        [key: string]: { title: string; subtitle: string };
      } = {
        agents: {
          title: "Gestion des Agents",
          subtitle: "Gérez vos stagiaires et prestataires",
        },
        absences: {
          title: "Demandes d'Absence",
          subtitle: "Consultez et validez les demandes de congés",
        },
        factures: {
          title: "Gestion des Factures",
          subtitle: "Consultez et validez les factures",
        },
        contracts: {
          title: "Gestion des Contrats",
          subtitle: "Consultez et gérez tous les contrats",
        },
        documents: {
          title: "Gestion des Documents",
          subtitle: "Consultez tous les documents des agents",
        },
      };
      return adminHeaderMap[activeSection] || adminHeaderMap.agents;
    }

    const headerMap: { [key: string]: { title: string; subtitle: string } } = {
      dashboard: {
        title: `Bienvenue, ${userData?.prenoms} ${userData?.nom}`,
        subtitle: "Voici votre dashboard",
      },
      documents: {
        title: `Bienvenue, ${userData?.prenoms} ${userData?.nom}`,
        subtitle: "Voici vos informations",
      },
      factures: {
        title: "Mes Factures",
        subtitle: "Consultez et gérez vos factures",
      },
      kpis: {
        title: "Mes Indicateurs de Performance",
        subtitle: "Suivez vos statistiques et performances",
      },
      absences: {
        title: "Mes demandes d'absences",
        subtitle: "Consultez votre historique d'absences et congés",
      },
      taches: {
        title: "Mes taches et timer",
        subtitle: "Consultez vos taches et votre timer",
      },
      rapports: {
        title: "Mes rapports",
        subtitle: "Consultez vos rapport",
      },
      certifications: {
        title: "Mes certifications",
        subtitle: "Consultez certificcation",
      },
      video: {
        title: "Bienvenue dans Onboarding",
        subtitle:
          "Regardez la video jusqu'à la fin pour bien commencer avec CODE-TALENT",
      },
      profil: {
        title: "Mon Profil",
        subtitle: "Gérez vos informations personnelles",
      },
    };

    return headerMap[activeSection] || headerMap.documents;
  };

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
    enabled:
      isMounted &&
      typeof window !== "undefined" &&
      !!localStorage.getItem("authToken"),
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", showArchivedAgents],
    queryFn: () => usersService.getAllAgents(showArchivedAgents),
    enabled: !!userData && isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: usersService.getUserStats,
    enabled: !!userData && isAdmin,
  });

  // Admin: Récupération de tous les contrats
  const { data: allContracts = [], isLoading: allContractsLoading } = useQuery({
    queryKey: ["all-contracts"],
    queryFn: async () => {
      const allAgents = await usersService.getAllAgents(true); // Inclure les archivés
      const contractPromises = allAgents.map((agent) =>
        contractService.getUserContracts(agent._id)
      );
      const contractsArrays = await Promise.all(contractPromises);
      return contractsArrays.flat();
    },
    enabled: !!userData && isAdmin,
  });

  // Admin: Récupération de tous les documents
  const { data: allDocuments = [], isLoading: allDocumentsLoading } = useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const allAgents = await usersService.getAllAgents(true); // Inclure les archivés
      const documentsPromises = allAgents.map((agent) =>
        documentService.getUserDocuments().catch(() => [])
      );
      const documentsArrays = await Promise.all(documentsPromises);
      return documentsArrays.flat();
    },
    enabled: !!userData && isAdmin,
  });

  // Agent: Récupération des contrats personnels
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractService.getUserContracts(userData?._id || ""),
    enabled: !!userData?._id && !isAdmin,
  });

  // Agent: Récupération des documents personnels
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentService.getUserDocuments,
    enabled: !!userData?._id && !isAdmin,
  });

  // Agent: Récupération des factures personnelles
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<
    Invoice[]
  >({
    queryKey: ["invoices"],
    queryFn: invoiceService.getMyInvoices,
    enabled: !!userData?._id && !isAdmin,
  });

  // Admin: Récupération de toutes les factures
  const { data: allInvoices = [], isLoading: allInvoicesLoading } = useQuery<
    Invoice[]
  >({
    queryKey: ["all-invoices"],
    queryFn: invoiceService.getAllInvoices,
    enabled: !!userData && isAdmin,
  });

  const { data: allKPIs = [], isLoading: allKPIsLoading } = useQuery<KPI[]>({
    queryKey: ["all-kpis"],
    queryFn: async () => {
      const response = await api.get("/kpis/all");
      return response.data;
    },
    enabled: !!userData && isAdmin,
  });

  const { data: kpis = [], isLoading: kpisLoading } = useQuery<KPI[]>({
    queryKey: ["kpis"],
    queryFn: kpiService.getUserKPIs,
    enabled: !!userData?._id && !isAdmin,
  });

  // Mutations
  // Supprimez la mutation deleteAgent existante et remplacez par :
  const archiveAgentMutation = useMutation({
    mutationFn: ({
      agentId,
      archiveReason,
    }: {
      agentId: string;
      archiveReason?: string;
    }) => usersService.archiveAgent(agentId, archiveReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: any) => {
      console.error("Erreur archivage agent:", error);
      alert(
        error.response?.data?.message || "Erreur lors de l'archivage de l'agent"
      );
    },
  });

  const restoreAgentMutation = useMutation({
    mutationFn: (agentId: string) => usersService.restoreAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: any) => {
      console.error("Erreur restauration agent:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la restauration de l'agent"
      );
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({
      agentId,
      updateData,
    }: {
      agentId: string;
      updateData: any;
    }) => usersService.updateAgent(agentId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (error: any) => {
      console.error("Erreur modification agent:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la modification de l'agent"
      );
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: ({
      month,
      year,
      reference,
      file,
    }: {
      month: number;
      year: number;
      reference: string;
      file: File;
    }) => {
      return invoiceService.createInvoice({ month, year, reference }, file);
    },
    onSuccess: async () => {
      // Invalider TOUTES les requêtes liées aux factures
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["all-invoices"] });

      // Forcer le rechargement immédiat
      await queryClient.refetchQueries({ queryKey: ["invoices"] });
      await queryClient.refetchQueries({ queryKey: ["all-invoices"] });
    },
    onError: (error: any) => {
      console.error("Erreur ajout facture:", error);
      alert(
        error.response?.data?.message || "Erreur lors de l'ajout de la facture"
      );
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["all-invoices"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression facture:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la suppression de la facture"
      );
    },
  });

  const validateInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: any }) =>
      invoiceService.updateInvoice(invoiceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-invoices"] });
    },
    onError: (error: any) => {
      console.error("Erreur validation facture:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la validation de la facture"
      );
    },
  });

  const uploadKPIMutation = useMutation({
    mutationFn: () => {
      if (!selectedKPIFile) throw new Error("Aucun fichier sélectionné");
      return kpiService.uploadKPI(selectedKPIFile, kpiUploadData);
    },
    onSuccess: async () => {
      // Invalider et recharger
      await queryClient.invalidateQueries({ queryKey: ["kpis"] });
      await queryClient.invalidateQueries({ queryKey: ["all-kpis"] });

      // Forcer le rechargement immédiat
      await queryClient.refetchQueries({ queryKey: ["kpis"] });
      await queryClient.refetchQueries({ queryKey: ["all-kpis"] });

      // Fermer le modal et réinitialiser
      setShowKPIModal(false);
      setSelectedKPIFile(null);
      setKPIUploadData({
        type: "rapport_mensuel",
        periode: new Date().toISOString().split("T")[0].substring(0, 7),
        description: "",
      });
    },
    onError: (error: any) => {
      console.error("Erreur upload KPI:", error);
      alert(error.response?.data?.message || "Erreur lors de l'upload du KPI");
    },
  });

  const deleteKPIMutation = useMutation({
    mutationFn: kpiService.deleteKPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression KPI:", error);
      alert(
        error.response?.data?.message || "Erreur lors de la suppression du KPI"
      );
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: () => contractService.generateContract(userData!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
    },
    onError: (error: any) => {
      console.error("Erreur génération contrat:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la génération du contrat"
      );
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Aucun fichier sélectionné");
      return documentService.uploadDocument(selectedFile, uploadData);
    },
    onSuccess: async () => {
      // Invalider et recharger
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["all-documents"] });

      // Forcer le rechargement immédiat
      await queryClient.refetchQueries({ queryKey: ["documents"] });
      await queryClient.refetchQueries({ queryKey: ["all-documents"] });

      // Fermer le modal et réinitialiser
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ type: "cin_recto", description: "" });
    },
    onError: (error: any) => {
      console.error("Erreur upload document:", error);
      alert(
        error.response?.data?.message || "Erreur lors de l'upload du document"
      );
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression document:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la suppression du document"
      );
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: contractService.deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression contrat:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la suppression du contrat"
      );
    },
  });

  // Handlers
  // Ajoutez ces handlers après les handlers existants :
  const handleArchiveAgent = async (
    agentId: string,
    archiveReason?: string
  ) => {
    archiveAgentMutation.mutate({ agentId, archiveReason });
  };

  const handleRestoreAgent = async (agentId: string) => {
    confirm({
      title: "Restaurer cet agent",
      description:
        "Êtes-vous sûr de vouloir restaurer cet agent ? L'agent redeviendra visible dans la liste des agents actifs.",
      confirmText: "Restaurer",
      cancelText: "Annuler",
      onConfirm: () => {
        restoreAgentMutation.mutate(agentId);
      },
    });
  };

  const handleToggleArchivedAgents = (show: boolean) => {
    setShowArchivedAgents(show);
  };

  const handleAddInvoice = (data: {
    month: number;
    year: number;
    reference: string;
    file: File;
  }) => {
    addInvoiceMutation.mutate(data);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    confirm({
      title: "Supprimer cette facture",
      description: "Êtes-vous sûr de vouloir supprimer cette facture ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteInvoiceMutation.mutate(invoiceId);
      },
    });
  };

  const handleValidateInvoice = (invoiceId: string, data: any) => {
    validateInvoiceMutation.mutate({ invoiceId, data });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    window.open(invoice.pdfUrl, "_blank");
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await invoiceService.downloadInvoice(invoice._id);
    } catch (error) {
      console.error("Erreur téléchargement facture:", error);
      try {
        await invoiceService.downloadInvoiceDirect(invoice);
      } catch (fallbackError) {
        console.error("Erreur avec la méthode de fallback:", fallbackError);
        alert("Impossible de télécharger la facture. Veuillez réessayer.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximum: 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKPIFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximum: 10MB");
        return;
      }
      setSelectedKPIFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }
    uploadDocumentMutation.mutate();
  };

  const handleKPIUpload = () => {
    if (!selectedKPIFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }
    uploadKPIMutation.mutate();
  };

  const handleDeleteDocument = (documentId: string) => {
    confirm({
      title: "Supprimer ce document",
      description: "Êtes-vous sûr de vouloir supprimer ce document ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteDocumentMutation.mutate(documentId);
      },
    });
  };

  const handleDeleteContract = (contractId: string) => {
    confirm({
      title: "Supprimer ce contract",
      description: "Êtes-vous sûr de vouloir supprimer ce contrat ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteContractMutation.mutate(contractId);
      },
    });
  };

  const handleDeleteKPI = (kpiId: string) => {
    confirm({
      title: "Supprimer ce KPI",
      description: "Êtes-vous sûr de vouloir supprimer ce KPI ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteKPIMutation.mutate(kpiId);
      },
    });
  };

  const handleDownloadContract = async (contract: Contract) => {
    try {
      const response = await fetch(contract.pdfUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = contract.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      window.open(contract.pdfUrl, "_blank");
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a") as HTMLAnchorElement;
      link.href = url;
      link.download = doc.originalName;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      window.open(doc.fileUrl, "_blank");
    }
  };

  const handleDownloadKPI = async (kpi: KPI) => {
    try {
      const response = await fetch(kpi.fileUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a") as HTMLAnchorElement;
      link.href = url;
      link.download = kpi.originalName;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement KPI:", error);
      window.open(kpi.fileUrl, "_blank");
    }
  };

  const handleViewDocument = (documentUrl: string) => {
    window.open(documentUrl, "_blank");
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/login");
        return;
      }
      if (profile) {
        setUserData(profile);
      }
    }
  }, [profile, router]);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  if (!isMounted || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex ${
        isAdmin ? "bg-[#0F0F12]" : "bg-[#0F0F12]"
      }`}
    >
      {dialog}
      {/* Sidebar - reste fixe */}
      <div className="fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userRole={userData?.role || "collaborateur"}
          userProfile={userData?.profile}
        />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header - fixed */}
        <div className="fixed top-0 left-64 right-0 z-30">
          <Header
            title={getHeaderContent().title}
            subtitle={getHeaderContent().subtitle}
            userInitials={`${userData.prenoms[0]}${userData.nom[0]}`}
            notificationBell={<NotificationBell />}
          />
        </div>

        {/* Contenu avec espace réservé pour header */}
        <div className="flex-1 overflow-auto mt-30">
          {" "}
          {/* mt-16 = hauteur du header */}
          <div className="p-8">
            {isAdmin && (
              <>
                {activeSection === "agents" && (
                  <AgentsSection
                    agents={agents}
                    agentsLoading={agentsLoading}
                    stats={stats}
                    onArchiveAgent={handleArchiveAgent}
                    onRestoreAgent={handleRestoreAgent}
                    archiveAgentPending={
                      archiveAgentMutation.isPending ||
                      restoreAgentMutation.isPending
                    }
                    onAgentCreated={() => {
                      queryClient.invalidateQueries({ queryKey: ["agents"] });
                      queryClient.invalidateQueries({ queryKey: ["stats"] });
                    }}
                    showArchived={showArchivedAgents}
                    onToggleArchived={handleToggleArchivedAgents}
                  />
                )}

                {activeSection === "absences" && <AbsencesSectionAdmin />}

                {activeSection === "factures" && (
                  <FacturesSectionAdmin
                    invoices={allInvoices}
                    agents={agents}
                    isLoading={allInvoicesLoading}
                    onView={handleViewInvoice}
                    onDownload={handleDownloadInvoice}
                    onDelete={handleDeleteInvoice}
                    onValidate={handleValidateInvoice}
                    deleteInvoicePending={deleteInvoiceMutation.isPending}
                    validateInvoicePending={validateInvoiceMutation.isPending}
                  />
                )}

                {activeSection === "kpis" && (
                  <KPIsSectionAdmin
                    kpis={allKPIs}
                    agents={agents}
                    isLoading={allKPIsLoading}
                    onDownload={handleDownloadKPI}
                    onView={(kpi) => window.open(kpi.fileUrl, "_blank")}
                  />
                )}

                {activeSection === "contracts" && (
                  <ContractsSectionAdmin
                    contracts={allContracts}
                    agents={agents}
                    isLoading={allContractsLoading}
                    onDownload={handleDownloadContract}
                    onView={(contract) =>
                      window.open(contract.pdfUrl, "_blank")
                    }
                    onDelete={handleDeleteContract}
                    deleteContractPending={deleteContractMutation.isPending}
                  />
                )}

                {activeSection === "documents" && (
                  <DocumentsSectionAdmin
                    agents={agents}
                    onDownload={handleDownloadDocument}
                    onView={(doc) => window.open(doc.fileUrl, "_blank")}
                    onDelete={handleDeleteDocument}
                    deleteDocumentPending={deleteDocumentMutation.isPending}
                  />
                )}

                {activeSection === "taches" && <TachesSection />}

                {activeSection === "espaces_partages" && < EspacesPartageSection /> }

                {activeSection === "espaces_des_agents" && < EspacesCollaboSection /> }

                {activeSection === "timer" && <TimerSection />}

                {activeSection === "rapports" && <RapportSection />}

                {activeSection === "rapports_collabo" && <RapportCollaboSection />}

                {activeSection === "video_admin" && <VideoSectionAdmin />}
              </>
            )}

            {isCollaborateur && (
              <>
                {activeSection === "documents" && (
                  <DocumentsSection
                    contracts={contracts}
                    documents={documents}
                    contractsLoading={contractsLoading}
                    documentsLoading={documentsLoading}
                    onGenerateContract={() => generateContractMutation.mutate()}
                    onAddDocument={() => setShowUploadModal(true)}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onDownloadContract={handleDownloadContract}
                    onDeleteDocument={handleDeleteDocument}
                    onDeleteContract={handleDeleteContract}
                    generateContractPending={generateContractMutation.isPending}
                    deleteDocumentPending={deleteDocumentMutation.isPending}
                    deleteContractPending={deleteContractMutation.isPending}
                  />
                )}

                {activeSection === "factures" && (
                  <FacturesSection
                    invoices={invoices}
                    invoicesLoading={invoicesLoading}
                    onAddInvoice={handleAddInvoice}
                    onViewInvoice={handleViewInvoice}
                    onDownloadInvoice={handleDownloadInvoice}
                    onDeleteInvoice={handleDeleteInvoice}
                    deleteInvoicePending={deleteInvoiceMutation.isPending}
                    addInvoicePending={addInvoiceMutation.isPending}
                  />
                )}

                {activeSection === "kpis" && (
                  <KPIsSection
                    kpis={kpis}
                    kpisLoading={kpisLoading}
                    onAddKPI={() => setShowKPIModal(true)}
                    onViewKPI={handleViewDocument}
                    onDownloadKPI={handleDownloadKPI}
                    onDeleteKPI={handleDeleteKPI}
                    deleteKPIPending={deleteKPIMutation.isPending}
                  />
                )}

                {activeSection === "profil" && (
                  <ProfilSection userData={userData} onLogout={handleLogout} />
                )}

                {activeSection === "absences" && <AbsencesSection />}

                {activeSection === "video" && <VideoSection />}

                {activeSection === "dashboard" && <DashboardSection />}

                {activeSection === "taches" && <TachesSection />}

                {activeSection === "espaces_partages" && < EspacesPartageSection /> }

                {activeSection === "timer" && <TimerSection />}

                {activeSection === "rapports" && <RapportSection />}
              </>
            )}

            {isManager && (
              <>
                {activeSection === "documents" && (
                  <DocumentsSection
                    contracts={contracts}
                    documents={documents}
                    contractsLoading={contractsLoading}
                    documentsLoading={documentsLoading}
                    onGenerateContract={() => generateContractMutation.mutate()}
                    onAddDocument={() => setShowUploadModal(true)}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onDownloadContract={handleDownloadContract}
                    onDeleteDocument={handleDeleteDocument}
                    onDeleteContract={handleDeleteContract}
                    generateContractPending={generateContractMutation.isPending}
                    deleteDocumentPending={deleteDocumentMutation.isPending}
                    deleteContractPending={deleteContractMutation.isPending}
                  />
                )}

                {activeSection === "factures" && (
                  <FacturesSection
                    invoices={invoices}
                    invoicesLoading={invoicesLoading}
                    onAddInvoice={handleAddInvoice}
                    onViewInvoice={handleViewInvoice}
                    onDownloadInvoice={handleDownloadInvoice}
                    onDeleteInvoice={handleDeleteInvoice}
                    deleteInvoicePending={deleteInvoiceMutation.isPending}
                    addInvoicePending={addInvoiceMutation.isPending}
                  />
                )}

                {activeSection === "kpis" && (
                  <KPIsSection
                    kpis={kpis}
                    kpisLoading={kpisLoading}
                    onAddKPI={() => setShowKPIModal(true)}
                    onViewKPI={handleViewDocument}
                    onDownloadKPI={handleDownloadKPI}
                    onDeleteKPI={handleDeleteKPI}
                    deleteKPIPending={deleteKPIMutation.isPending}
                  />
                )}

                {activeSection === "absences" && <AbsencesSection />}

                {activeSection === "video" && <VideoSection />}

                {activeSection === "dashboard" && <DashboardSection />}

                {activeSection === "taches" && <TachesSection />}

                {activeSection === "espaces_partages" && < EspacesPartageSection /> }

                {activeSection === "espaces_des_agents" && < EspacesCollaboSection /> }

                {activeSection === "timer" && <TimerSection />}

                {activeSection === "rapports" && <RapportSection />}

                {activeSection === "rapports_collabo" && <RapportCollaboSection />}
              </>
            )}

            {/* {isClient && (
              <>
                {activeSection === "pofil" && <ProfilSectionProps />}
              </>
            )} */}
          </div>
        </div>
      </div>

      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploadData={uploadData}
        onUploadDataChange={setUploadData}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onUpload={handleUpload}
        isLoading={uploadDocumentMutation.isPending}
      />

      <UploadKPIModal
        isOpen={showKPIModal}
        onClose={() => setShowKPIModal(false)}
        uploadData={kpiUploadData}
        onUploadDataChange={setKPIUploadData}
        selectedFile={selectedKPIFile}
        onFileSelect={handleKPIFileSelect}
        onUpload={handleKPIUpload}
        isLoading={uploadKPIMutation.isPending}
      />
    </div>
  );
}

export default function HomePageWrapper() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}
