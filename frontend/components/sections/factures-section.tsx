// frontend/components/sections/factures-section.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddFactureDialog } from "@/components/dialogs/add-facture-dialog";
import type { Invoice } from "@/lib/types";

interface FacturesSectionProps {
  invoices: Invoice[];
  invoicesLoading: boolean;
  onAddInvoice: (data: {
    month: number;
    year: number;
    reference: string;
    amount: number;
    file: File;
  }) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  deleteInvoicePending: boolean;
  addInvoicePending?: boolean;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payée" },
  { value: "unpaid", label: "Non payée" }, // AJOUT
];

const STATUS_COLORS: Record<string, { badge: string; text: string }> = {
  pending: { badge: "bg-amber-100 text-amber-800", text: "En attente" },
  paid: { badge: "bg-green-100 text-green-800", text: "Payée" },
  unpaid: { badge: "bg-red-100 text-red-800", text: "Non payée" }, // AJOUT
};

const MONTHS = [
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

export function FacturesSection({
  invoices = [],
  invoicesLoading,
  onAddInvoice,
  onViewInvoice,
  onDownloadInvoice,
  onDeleteInvoice,
  deleteInvoicePending,
  addInvoicePending = false,
}: FacturesSectionProps) {
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const availableYears = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const yearMatch =
      selectedYear === "all" || invoice.year.toString() === selectedYear;
    const monthMatch =
      selectedMonth === "all" || invoice.month.toString() === selectedMonth;
    const statusMatch =
      selectedStatus === "all" || invoice.status === selectedStatus;
    return yearMatch && monthMatch && statusMatch;
  });

  const getStatusInfo = (status: string) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  const getMonthName = (month: number) => {
    return MONTHS[month - 1] || "Mois inconnu";
  };

  // frontend/components/sections/factures-section.tsx

  const handleDialogSubmit = (data: {
    month: number;
    year: number;
    reference: string;
    amount: number;
    file: File | null;
  }) => {
    if (!data.file) {
      alert("Veuillez sélectionner un fichier PDF");
      return;
    }

    onAddInvoice({
      month: data.month,
      year: data.year,
      reference: data.reference,
      amount: data.amount,
      file: data.file,
    });
    setIsDialogOpen(false);
  };

  // Modifiez le calcul des statistiques pour inclure "unpaid" :
  const totalInvoices = filteredInvoices.length;
  const invoicesPaid = filteredInvoices.filter(
    (f) => f.status === "paid",
  ).length;
  const invoicesPending = filteredInvoices.filter(
    (f) => f.status === "pending",
  ).length;
  const invoicesUnpaid = filteredInvoices.filter(
    (f) => f.status === "unpaid",
  ).length;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-8">
      <div className="bg-[#1F2128] backdrop-blur-sm rounded-2xl border border-[#313442] p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-[#F1F1F1]">
            Mes Factures
          </h3>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une facture
          </Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap text-white">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] border-[#313442]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] border-[#313442]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {MONTHS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px] border-[#313442]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {invoicesLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <p className="text-[#F1F1F1] mt-2 font-medium text-sm">
              Chargement des factures...
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-6 bg-[#303237] rounded-xl">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-[#F1F1F1] font-medium text-sm">
              Aucune facture trouvée
            </p>
            <p className="text-xs text-[#F1F1F1] mt-1">
              Cliquez sur "Ajouter une facture" pour créer votre première
              facture
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice._id}
                className="border-[#313442] hover:shadow-lg hover:shadow-[#313442] transition-all duration-300 hover:scale-105 bg-[#1F2128] backdrop-blur-sm"
              >
                <CardContent className="">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#F1F1F1] truncate">
                        {getMonthName(invoice.month)} {invoice.year}
                      </h4>
                      <p className="text-sm text-[#F1F1F1]">
                        {invoice.reference}
                      </p>
                      {invoice.paymentDate && (
                        <p className="text-xs text-[#F1F1F1]">
                          Payé le{" "}
                          {new Date(invoice.paymentDate).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      )}
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            getStatusInfo(invoice.status).badge
                          }`}
                        >
                          {getStatusInfo(invoice.status).text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#313442]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadInvoice(invoice)}
                      disabled={deleteInvoicePending}
                      className="text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteInvoice(invoice._id)}
                      disabled={deleteInvoicePending}
                      className="text-xs border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-[#313442] bg-[#1F2128] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#F1F1F1] font-medium">
                  Total factures
                </p>
                <p className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {totalInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#313442] bg-[#1F2128] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#F1F1F1] font-medium">En attente</p>
                <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {invoicesPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#313442] bg-[#1F2128] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#F1F1F1] font-medium">Payées</p>
                <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {invoicesPaid}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddFactureDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleDialogSubmit}
        isSubmitting={addInvoicePending}
      />
    </div>
  );
}
