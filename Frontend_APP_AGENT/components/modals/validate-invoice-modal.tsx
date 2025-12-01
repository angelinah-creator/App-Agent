"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice } from "@/lib/types";

interface ValidateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onValidate: (data: {
    amount: number;
    paymentDate: string;
    transferReference: string;
    status: string;
  }) => void;
  isLoading: boolean;
}

export function ValidateInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onValidate,
  isLoading,
}: ValidateInvoiceModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [transferReference, setTransferReference] = useState<string>("");
  const [status, setStatus] = useState<string>("paid"); // Par défaut "payée"

  useEffect(() => {
    if (isOpen) {
      // Pré-remplir avec les valeurs existantes si disponibles
      setAmount(invoice.amount?.toString() || "");
      setPaymentDate(
        invoice.paymentDate
          ? new Date(invoice.paymentDate).toISOString().split("T")[0]
          : ""
      );
      setTransferReference(invoice.transferReference || "");
      setStatus(invoice.status || "paid");
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !paymentDate || !transferReference) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Le montant doit être un nombre positif");
      return;
    }

    onValidate({
      amount: amountNum,
      paymentDate,
      transferReference,
      status,
    });
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl border-slate-200/50 animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Valider la facture
                </h3>
                <p className="text-sm text-slate-600">
                  Complétez les informations de paiement
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Informations de la facture */}
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
            <h4 className="font-semibold text-violet-900 mb-3">
              Informations de la facture
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Référence:</span>
                <p className="font-medium text-slate-800">
                  {invoice.reference}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Période:</span>
                <p className="font-medium text-slate-800">
                  {getMonthName(invoice.month)} {invoice.year}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-600">Statut actuel:</span>
                <p className="font-medium text-slate-800">
                  {invoice.status === "pending"
                    ? "En attente"
                    : invoice.status === "paid"
                    ? "Payée"
                    : "Non payée"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 font-medium">
                Montant (Ar) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="transition-all duration-300 focus:scale-[1.01] border-slate-300 focus:border-green-500 focus:ring-green-500 bg-white"
              />
              <p className="text-xs text-slate-500">
                Montant total de la facture en euros
              </p>
            </div>

            {/* Date de paiement */}
            <div className="space-y-2">
              <Label
                htmlFor="paymentDate"
                className="text-slate-700 font-medium"
              >
                Date de paiement <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="transition-all duration-300 focus:scale-[1.01] border-slate-300 focus:border-green-500 focus:ring-green-500 bg-white"
              />
              <p className="text-xs text-slate-500">
                Date à laquelle le paiement a été effectué
              </p>
            </div>

            {/* Référence de virement */}
            <div className="space-y-2">
              <Label
                htmlFor="transferReference"
                className="text-slate-700 font-medium"
              >
                Référence de virement <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transferReference"
                type="text"
                placeholder="VIR-2025-001234"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                required
                className="transition-all duration-300 focus:scale-[1.01] border-slate-300 focus:border-green-500 focus:ring-green-500 bg-white"
              />
              <p className="text-xs text-slate-500">
                Numéro de référence du virement bancaire
              </p>
            </div>

            {/* Statut - Simplifié avec seulement payée/non payée */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-700 font-medium">
                Statut <span className="text-red-500">*</span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="transition-all duration-300 focus:scale-[1.01] border-slate-300 focus:border-green-500 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Payée</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unpaid">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Non payée</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Statut de paiement de la facture
              </p>
            </div>

            {/* Avertissement */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Important:</strong> L'agent sera automatiquement
                notifié de cette validation par email et notification.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  isLoading || !amount || !paymentDate || !transferReference
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider la facture
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 transition-all duration-200 bg-transparent"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
