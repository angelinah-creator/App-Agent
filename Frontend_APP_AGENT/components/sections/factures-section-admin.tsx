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
      amount: number;
      paymentDate: string;
      transferReference: string;
      status: string;
    }
  ) => void;
  deleteInvoicePending: boolean;
  validateInvoicePending?: boolean;
}

// Fonction utilitaire pour vérifier si agentId est un objet peuplé
const isPopulatedAgent = (
  agent: any
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
    (currentYear - i).toString()
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
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ); // Tri du plus récent au plus ancien

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
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {filteredInvoices.length} facture
            {filteredInvoices.length > 1 ? "s" : ""} trouvée
            {filteredInvoices.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-600">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-slate-600">Payées</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{unpaidCount}</p>
            <p className="text-xs text-slate-600">Non payées</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une facture ou un agent..."
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
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="unpaid">Non payées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.prenoms} {agent.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
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
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                        <Receipt className="w-6 h-6 text-violet-600" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <h3 className="font-semibold text-lg text-slate-800">
                              {agentDetails.name}
                            </h3>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Référence:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {invoice.reference || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Période:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {getMonthName(invoice.month)} {invoice.year}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Email:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {agentDetails.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Profil:</span>
                            <span className="ml-2 font-medium text-slate-800 capitalize">
                              {agentDetails.profile}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Montant:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatAmount(invoice.amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Date de paiement:
                            </span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatDate(invoice.paymentDate)}
                            </span>
                          </div>
                          {invoice.transferReference && (
                            <div className="col-span-2">
                              <span className="text-slate-500">
                                Réf. virement:
                              </span>
                              <span className="ml-2 font-medium text-slate-800">
                                {invoice.transferReference}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500">
                              Date création:
                            </span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatDate(invoice.createdAt)}
                            </span>
                          </div>
                          {invoice.processedBy && (
                            <div>
                              <span className="text-slate-500">
                                Traité par:
                              </span>
                              <span className="ml-2 font-medium text-slate-800">
                                {getProcessedByInfo(invoice.processedBy)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {invoice.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidate(invoice)}
                          className="hover:bg-green-50 hover:border-green-300 text-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                      )}
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(invoice)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(invoice)}
                        className="hover:bg-blue-600 hover:border-indigo-300"
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
                        className="hover:bg-red-600 hover:border-red-300 text-red-600"
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
