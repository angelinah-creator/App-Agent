"use client";

import { useState } from "react";
import {
  Receipt,
  Eye,
  Download,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
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
import { ValidateInvoiceModal } from "@/components/modals/validate-invoice-modal";
import type { Invoice } from "@/lib/types";
import type { Agent } from "@/lib/users-service";

interface FacturesSectionAdminProps {
  invoices: any[];
  agents: Agent[];
  isLoading: boolean;
  onView: (invoice: any) => void;
  onDownload: (invoice: any) => void;
  onDelete: (invoiceId: string) => void;
  onValidate: (
    invoiceId: string,
    data: {
      paymentDate: string;
      transferReference: string;
      status: string;
    },
  ) => void;
  deleteInvoicePending: boolean;
  validateInvoicePending?: boolean;
}

// Fonction utilitaire pour vérifier si agentId est un objet peuplé
const isPopulatedAgent = (
  agent: any,
): agent is {
  _id: string;
  nom: string;
  prenoms: string;
  email: string;
  profile: string;
} => {
  return (
    agent && typeof agent === "object" && "nom" in agent && "prenoms" in agent
  );
};

// Fonction utilitaire pour obtenir l'ID de l'agent peu importe le format
const getAgentId = (agentId: string | any): string => {
  if (isPopulatedAgent(agentId)) {
    return agentId._id;
  }
  return agentId;
};

// Fonction utilitaire pour obtenir les infos de l'agent peu importe le format
const getAgentInfo = (agentId: string | any, agents: Agent[]): string => {
  if (isPopulatedAgent(agentId)) {
    return `${agentId.prenoms} ${agentId.nom}`;
  }

  const agent = agents.find((a) => a._id === agentId);
  return agent ? `${agent.prenoms} ${agent.nom}` : "Agent inconnu";
};

// Fonction utilitaire pour obtenir les détails complets de l'agent
const getAgentDetails = (agentId: string | any, agents: Agent[]) => {
  if (isPopulatedAgent(agentId)) {
    return {
      name: `${agentId.prenoms} ${agentId.nom}`,
      email: agentId.email,
      profile: agentId.profile,
      id: agentId._id,
    };
  }

  const agent = agents.find((a) => a._id === agentId);
  return agent
    ? {
        name: `${agent.prenoms} ${agent.nom}`,
        email: agent.email,
        profile: agent.profile,
        id: agent._id,
      }
    : {
        name: "Agent inconnu",
        email: "N/A",
        profile: "N/A",
        id: "unknown",
      };
};

export function FacturesSectionAdmin({
  invoices,
  agents,
  isLoading,
  onView,
  onDownload,
  onDelete,
  onValidate,
  deleteInvoicePending,
  validateInvoicePending = false,
}: FacturesSectionAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);

  // Générer les années disponibles (5 dernières années)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) =>
    (currentYear - i).toString(),
  );

  // Générer les mois
  const availableMonths = [
    { value: "1", label: "Janvier" },
    { value: "2", label: "Février" },
    { value: "3", label: "Mars" },
    { value: "4", label: "Avril" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" },
    { value: "8", label: "Août" },
    { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" },
  ];

  // Filtrage avec gestion des différents formats d'agentId
  const filteredInvoices = [...invoices]
    .filter((invoice) => {
      const agentId = getAgentId(invoice.agentId);
      const agent = agents.find((a) => a._id === agentId);

      const matchesSearch =
        searchTerm === "" ||
        (invoice.reference &&
          invoice.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (agent?.nom &&
          agent.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (agent?.prenoms &&
          agent.prenoms.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" || invoice.status === filterStatus;
      const matchesAgent = filterAgent === "all" || agentId === filterAgent;
      const matchesMonth =
        filterMonth === "all" || invoice.month.toString() === filterMonth;
      const matchesYear =
        filterYear === "all" || invoice.year.toString() === filterYear;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAgent &&
        matchesMonth &&
        matchesYear
      );
    })

  const getProcessedByInfo = (processedBy: any): string => {
    if (!processedBy) return "Non traité";

    if (
      typeof processedBy === "object" &&
      processedBy.nom &&
      processedBy.prenoms
    ) {
      return `${processedBy.prenoms} ${processedBy.nom}`;
    }

    if (typeof processedBy === "string") {
      return processedBy;
    }

    return "Administrateur";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "En attente",
      },
      paid: { bg: "bg-green-100", text: "text-green-700", label: "Payée" },
      unpaid: { bg: "bg-red-100", text: "text-red-700", label: "Non payée" }, // AJOUT
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return months[month - 1] || "Mois inconnu";
  };

  const formatDate = (date?: string) => {
    if (!date) return "Non définie";
    try {
      return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Date invalide";
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return "Non défini";
    return amount.toLocaleString("fr-FR") + " Ariary";
  };

  const handleValidate = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowValidateModal(true);
  };

  // Statistiques
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;

  return (
    <div className="space-y-4 sm:space-y-6 -mt-2 sm:-mt-8">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <h1 className="text-white font-extrabold text-xl sm:text-2xl">
            Gestion des Factures
          </h1>
          <div>
            <p className="text-slate-600 mt-1">
              {filteredInvoices.length} facture
              {filteredInvoices.length > 1 ? "s" : ""} trouvée
              {filteredInvoices.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-600">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-slate-600">Payées</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{unpaidCount}</p>
            <p className="text-xs text-slate-600">Non payées</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-[#1F2128] border-[#313442]">
        <CardContent className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              <Input
                placeholder="Rechercher une facture ou un agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="unpaid">Non payées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.prenoms} {agent.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Toutes les années</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucune facture trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInvoices.map((invoice) => {
            const agentDetails = getAgentDetails(invoice.agentId, agents);

            return (
              <Card
                key={invoice._id}
                className="hover:shadow-lg transition-shadow text-white bg-[#1F2128] border-[#313442]"
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gray-500/30 rounded-xl">
                        <Receipt className="w-6 h-6 text-violet-600" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-white" />
                            <h3 className="font-semibold text-base sm:text-lg text-white">
                              {agentDetails.name}
                            </h3>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-white">Référence:</span>
                            <span className="ml-2 font-semibold text-violet-300">
                              {invoice.reference || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-white">Période:</span>
                            <span className="ml-2 font-semibold text-violet-300">
                              {getMonthName(invoice.month)} {invoice.year}
                            </span>
                          </div>
                          <div>
                            <span className="text-white">Montant:</span>
                            <span className="ml-2 font-semibold text-violet-300">
                              {invoice.amount
                                ? invoice.amount.toLocaleString("fr-FR") + " Ar"
                                : "Non défini"}
                            </span>
                          </div>
                          {/* Informations secondaires (visibles seulement si renseignées) */}
                          {invoice.paymentDate && (
                            <div>
                              <span className="text-white">
                                Date de paiement:
                              </span>
                              <span className="ml-2 font-medium text-white">
                                {formatDate(invoice.paymentDate)}
                              </span>
                            </div>
                          )}
                          {invoice.transferReference && (
                            <div className="col-span-2">
                              <span className="text-white">Réf. virement:</span>
                              <span className="ml-2 font-medium text-white">
                                {invoice.transferReference}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:ml-4">
                      {invoice.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidate(invoice)}
                          className="border border-green-500/40 bg-transparent hover:bg-green-500 hover:border-green-600 text-green-400 hover:text-white focus:ring-green-500"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(invoice)}
                        className="border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4" />
                        Telecharger
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onDelete(invoice._id);
                        }}
                        disabled={deleteInvoicePending}
                        className="border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de validation */}
      {selectedInvoice && (
        <ValidateInvoiceModal
          isOpen={showValidateModal}
          onClose={() => {
            setShowValidateModal(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onValidate={(data) => {
            onValidate(selectedInvoice._id, data);
            setShowValidateModal(false);
            setSelectedInvoice(null);
          }}
          isLoading={validateInvoicePending}
        />
      )}
    </div>
  );
}
