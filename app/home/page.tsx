// frontend/app/home/page.tsx (extrait des parties modifiées)
"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
// import type { UserData } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DocumentsSection } from "@/components/sections/documents-section";
import { FacturesSection } from "@/components/sections/factures-section";
import { FacturesSectionAdmin } from "@/components/sections/factures-section-admin";
import { KPIsSection } from "@/components/sections/kpis-section";
import { ProfilSection } from "@/components/sections/profil-section";
import { AbsencesSection } from "@/components/sections/absences-section";
import { AbsencesSectionAdmin } from "@/components/sections/absences-section-admin";
import { AgentsSection } from "@/components/sections/agents-section";
import { ContractsSectionAdmin } from "@/components/sections/contracts-section-admin";
import { DocumentsSectionAdmin } from "@/components/sections/documents-section-admin";
import { UploadDocumentModal } from "@/components/modals/upload-document-modal";
import { UploadKPIModal } from "@/components/modals/upload-kpi-modal";
import { KPIsSectionAdmin } from "@/components/sections/kpis-section-admin";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { ndaService, type Nda } from "@/lib/nda-service";
import { NdaSectionAdmin } from "@/components/sections/nda-section-admin";
import type { Agent } from "@/lib/users-service";
import { api } from "@/lib/api-config";
import { NotificationModal } from "@/components/modals/notification-modal";

function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<Agent | null>(null);
  const [activeSection, setActiveSection] = useState("documents");
  const [isMounted, setIsMounted] = useState(false);
  const [showArchivedAgents, setShowArchivedAgents] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

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

  const isAdmin = (userData?.profile as unknown as string) === "admin";

  useEffect(() => {
    if (userData) {
      setActiveSection(isAdmin ? "agents" : "documents");
    }
  }, [userData, isAdmin]);

  // Fonction pour afficher une notification
  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "success"
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

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
        ndas: {
          title: "Gestion des NDA",
          subtitle: "Consultez tous les accords de confidentialité",
        },
      };
      return adminHeaderMap[activeSection] || adminHeaderMap.agents;
    }

    const headerMap: { [key: string]: { title: string; subtitle: string } } = {
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

  // Admin: Récupération de tous les NDA
  const { data: allNdas = [], isLoading: allNdasLoading } = useQuery({
    queryKey: ["all-ndas"],
    queryFn: async () => {
      const allAgents = await usersService.getAllAgents(true); // Inclure les archivés
      const ndaPromises = allAgents.map((agent) =>
        ndaService
          .getUserNda(agent._id)
          .then((nda) => (nda && nda._id ? nda : null))
      );
      const ndasArray = await Promise.all(ndaPromises);
      return ndasArray.filter((nda) => nda !== null) as Nda[];
    },
    enabled: !!userData && isAdmin,
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

  // Agent: Récupération du NDA personnel
  const { data: nda, isLoading: ndaLoading } = useQuery({
    queryKey: ["nda"],
    queryFn: () => ndaService.getUserNda(userData?._id || ""),
    enabled: !!userData?._id && !isAdmin,
  });

  // Transformez le NDA en tableau pour le composant
  const ndas = nda && nda._id ? [nda] : [];

  // Ajoutez ces mutations:

  const generateNdaMutation = useMutation({
    mutationFn: () => ndaService.generateNda(userData!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nda"] });
    },
    onError: (error: any) => {
      console.error("Erreur génération NDA:", error);
      alert(
        error.response?.data?.message || "Erreur lors de la génération du NDA"
      );
    },
  });

  const deleteNdaMutation = useMutation({
    mutationFn: ndaService.deleteNda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nda"] });
      queryClient.invalidateQueries({ queryKey: ["all-ndas"] });
    },
    onError: (error: any) => {
      console.error("Erreur suppression NDA:", error);
      alert(
        error.response?.data?.message || "Erreur lors de la suppression du NDA"
      );
    },
  });

  const handleDeleteNda = (ndaId: string) => {
    confirm({
      title: "Supprimer ce NDA",
      description:
        "Êtes-vous sûr de vouloir supprimer cet accord de confidentialité ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteNdaMutation.mutate(ndaId);
      },
    });
  };

  const handleDownloadNda = async (nda: Nda) => {
    try {
      const response = await fetch(nda.pdfUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nda.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      window.open(nda.pdfUrl, "_blank");
    }
  };

  const handleViewNda = (nda: Nda) => {
    window.open(nda.pdfUrl, "_blank");
  };

  const handleDownloadNdaAdmin = async (nda: Nda) => {
    try {
      const response = await fetch(nda.pdfUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nda.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      window.open(nda.pdfUrl, "_blank");
    }
  };

  const handleDeleteNdaAdmin = (ndaId: string) => {
    confirm({
      title: "Supprimer ce NDA",
      description:
        "Êtes-vous sûr de vouloir supprimer cet accord de confidentialité ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => {
        deleteNdaMutation.mutate(ndaId);
      },
    });
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Agent>) => usersService.updateMyProfile(data),
    onSuccess: async (updatedUser: Agent) => {
      setUserData(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Utiliser la notification au lieu d'alert
      showNotification(
        "Profil mis à jour",
        "Vos informations ont été mises à jour avec succès.",
        "success"
      );
    },
    onError: (error: any) => {
      console.error("Erreur mise à jour profil:", error);

      // Utiliser la notification au lieu d'alert
      showNotification(
        "Erreur de mise à jour",
        error.message || "Erreur lors de la mise à jour du profil",
        "error"
      );
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => usersService.updateMyPassword(currentPassword, newPassword),
    onSuccess: () => {
      // Utiliser la notification au lieu d'alert
      showNotification(
        "Mot de passe modifié",
        "Votre mot de passe a été modifié avec succès.",
        "success"
      );
    },
    onError: (error: any) => {
      console.error("Erreur changement mot de passe:", error);

      // On laisse l'erreur se propager pour que ProfilSection puisse la gérer
      throw error;
    },
  });

  const handleUpdateProfile = async (data: Partial<Agent>) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      // La notification est gérée dans la mutation
    } catch (error) {
      // L'erreur est déjà gérée dans la mutation
      console.error("Error in handleUpdateProfile:", error);
    }
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
        isAdmin
          ? "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50"
          : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50"
      }`}
    >
      {dialog}
      {/* Sidebar - reste fixe */}
      <div className="fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userProfile={userData.profile!}
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

                {activeSection === "ndas" && (
                  <NdaSectionAdmin
                    ndas={allNdas}
                    agents={agents}
                    isLoading={allNdasLoading}
                    onDownload={handleDownloadNdaAdmin}
                    onView={handleViewNda}
                    onDelete={handleDeleteNdaAdmin}
                    deleteNdaPending={deleteNdaMutation.isPending}
                  />
                )}

                {activeSection === "profil" && (
                  <ProfilSection
                    userData={userData}
                    onLogout={handleLogout}
                    onUpdateProfile={handleUpdateProfile} // Changé ici
                    onUpdatePassword={(current, newPass) =>
                      updatePasswordMutation.mutateAsync({
                        currentPassword: current,
                        newPassword: newPass,
                      })
                    }
                  />
                )}
              </>
            )}

            {!isAdmin && (
              <>
                {activeSection === "documents" && (
                  <DocumentsSection
                    contracts={contracts}
                    ndas={ndas}
                    documents={documents}
                    contractsLoading={contractsLoading}
                    ndasLoading={ndaLoading}
                    documentsLoading={documentsLoading}
                    onGenerateContract={() => generateContractMutation.mutate()}
                    onGenerateNda={() => generateNdaMutation.mutate()}
                    onAddDocument={() => setShowUploadModal(true)}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onDownloadContract={handleDownloadContract}
                    onDownloadNda={handleDownloadNda}
                    onDeleteDocument={handleDeleteDocument}
                    onDeleteContract={handleDeleteContract}
                    onDeleteNda={handleDeleteNda}
                    generateContractPending={generateContractMutation.isPending}
                    generateNdaPending={generateNdaMutation.isPending}
                    deleteDocumentPending={deleteDocumentMutation.isPending}
                    deleteContractPending={deleteContractMutation.isPending}
                    deleteNdaPending={deleteNdaMutation.isPending}
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
                  <ProfilSection
                    userData={userData}
                    onLogout={handleLogout}
                    onUpdateProfile={handleUpdateProfile} // Changé ici
                    onUpdatePassword={(current, newPass) =>
                      updatePasswordMutation.mutateAsync({
                        currentPassword: current,
                        newPassword: newPass,
                      })
                    }
                  />
                )}

                {activeSection === "absences" && <AbsencesSection />}
              </>
            )}
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

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
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
