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
    new Date().getFullYear().toString()
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
    file: File | null;
  }) => {
    if (!data.file) {
      alert("Veuillez sélectionner un fichier PDF");
      return;
    }

    // CORRECTION: Utiliser les données passées par le dialog
    onAddInvoice({
      month: data.month,
      year: data.year,
      reference: data.reference,
      file: data.file,
    });
    setIsDialogOpen(false);
  };

  // Modifiez le calcul des statistiques pour inclure "unpaid" :
  const totalInvoices = filteredInvoices.length;
  const invoicesPaid = filteredInvoices.filter(
    (f) => f.status === "paid"
  ).length;
  const invoicesPending = filteredInvoices.filter(
    (f) => f.status === "pending"
  ).length;
  const invoicesUnpaid = filteredInvoices.filter(
    (f) => f.status === "unpaid"
  ).length; // AJOUT

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Mes Factures</h3>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une facture
          </Button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px] border-slate-200/50 bg-white/50">
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
            <SelectTrigger className="w-[160px] border-slate-200/50 bg-white/50">
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
            <SelectTrigger className="w-[160px] border-slate-200/50 bg-white/50">
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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <p className="text-slate-600 mt-3 font-medium">
              Chargement des factures...
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-xl">
            <FileText className="mx-auto h-14 w-14 text-slate-400" />
            <p className="mt-4 text-slate-600 font-medium">
              Aucune facture trouvée
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Cliquez sur "Ajouter une facture" pour créer votre première
              facture
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice._id}
                className="border-slate-200/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-6 h-6 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {invoice.reference}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {getMonthName(invoice.month)} {invoice.year}
                      </p>
                      {invoice.amount && (
                        <p className="text-sm font-medium text-violet-600 mt-1">
                          {invoice.amount.toLocaleString("fr-FR")} Ar
                        </p>
                      )}
                      {invoice.paymentDate && (
                        <p className="text-xs text-slate-500">
                          Payé le{" "}
                          {new Date(invoice.paymentDate).toLocaleDateString(
                            "fr-FR"
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
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewInvoice(invoice)}
                      className="flex-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button> */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadInvoice(invoice)}
                      disabled={deleteInvoicePending}
                      className="text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteInvoice(invoice._id)}
                      disabled={deleteInvoicePending}
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-violet-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Total factures
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {totalInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">En attente</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {invoicesPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-green-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Payées</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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
