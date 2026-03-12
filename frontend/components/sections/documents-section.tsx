"use client";

import {
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@/lib/document-service";
import type { Contract } from "@/lib/contract-service";
import type { Nda } from "@/lib/nda-service";
import { useEffect } from "react";

interface DocumentsSectionProps {
  contracts: Contract[];
  documents: Document[];
  contractsLoading: boolean;
  documentsLoading: boolean;
  onGenerateContract: () => void;
  onAddDocument: () => void;
  onViewDocument: (url: string) => void;
  onDownloadDocument: (doc: Document) => void;
  onDownloadContract: (contract: Contract) => void;
  onDeleteDocument: (id: string) => void;
  onDeleteContract: (id: string) => void;
  generateContractPending: boolean;
  deleteDocumentPending: boolean;
  deleteContractPending: boolean;
  ndas: Nda[];
  ndasLoading: boolean;
  onGenerateNda: () => void;
  onDownloadNda: (nda: Nda) => void;
  onDeleteNda: (id: string) => void;
  generateNdaPending: boolean;
  deleteNdaPending: boolean;
  // ── Génération différée ──
  contractPending?: boolean;
  onReadContract?: () => void;
}

export function DocumentsSection({
  contracts,
  documents,
  contractsLoading,
  documentsLoading,
  onGenerateContract,
  onAddDocument,
  onViewDocument,
  onDownloadDocument,
  onDownloadContract,
  onDeleteDocument,
  onDeleteContract,
  generateContractPending,
  deleteDocumentPending,
  deleteContractPending,
  ndas,
  ndasLoading,
  onGenerateNda,
  onDownloadNda,
  onDeleteNda,
  generateNdaPending,
  deleteNdaPending,
  contractPending = false,
  onReadContract,
}: DocumentsSectionProps) {
  // true UNIQUEMENT si contractPending ET qu'aucun contrat n'existe encore
  const showReadButton = contractPending && contracts.length === 0;

  useEffect(() => {
    console.log("📊 Documents Section - NDAs:", {
      count: ndas.length,
      loading: ndasLoading,
      data: ndas,
    });
  }, [ndas, ndasLoading]);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-8">
      <div className="flex space-x-4">

        {/* SECTION CONTRAT */}
        <div className="bg-[#1F2128] backdrop-blur-sm rounded-2xl border border-[#313442] p-3 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#F1F1F1]">
              Mon Contrat
            </h3>

            {/* Bouton "Lire" si en attente + aucun contrat, sinon "Générer" */}
            {showReadButton ? (
              <Button
                onClick={onReadContract}
                className="bg-[#6C4EA8] hover:bg-[#7d5fc0] text-white transition-all duration-200"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Lire et signer mon contrat
              </Button>
            ) : (
              <Button
                onClick={onGenerateContract}
                disabled={generateContractPending}
                className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {generateContractPending ? "Génération..." : "Générer un Contrat"}
              </Button>
            )}
          </div>

          {showReadButton ? (
            /* ── En attente de lecture / signature ── */
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-[#6C4EA8]/50 bg-[#6C4EA8]/5">
              <div className="w-12 h-12 rounded-full bg-[#6C4EA8]/15 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-[#9b7ed4]" />
              </div>
              <p className="text-[#F1F1F1] font-medium text-sm mb-1">
                Votre contrat est prêt à être consulté
              </p>
              <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
                Lisez attentivement votre contrat avant de le signer. Si des
                informations ne vous conviennent pas, modifiez-les depuis
                l'onglet{" "}
                <span className="text-[#9b7ed4] font-medium">Profil</span>{" "}
                puis revenez ici.
              </p>
              {/* <button
                onClick={onReadContract}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6C4EA8] hover:bg-[#7d5fc0] text-white text-xs font-medium transition-all duration-200"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Lire et signer mon contrat
              </button> */}
            </div>
          ) : contractsLoading ? (
            /* ── Chargement ── */
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600 mx-auto" />
              <p className="text-[#F1F1F1] mt-2 font-medium text-sm">
                Chargement des contrats...
              </p>
            </div>
          ) : contracts.length === 0 ? (
            /* ── Aucun contrat ── */
            <div className="text-center py-6 bg-[#1F2128] rounded-xl">
              <FileText className="mx-auto h-10 w-10 text-[#F1F1F1]" />
              <p className="mt-3 text-[#F1F1F1] font-medium text-sm">
                Aucun contrat généré
              </p>
              <p className="text-xs text-[#F1F1F1] mt-1">
                Cliquez sur "Générer un Contrat" pour créer votre premier
                contrat
              </p>
            </div>
          ) : (
            /* ── Liste des contrats (affichage normal) ── */
            <div className="overflow-x-auto rounded-xl border border-[#313442]">
              <table className="w-full">
                <tbody>
                  {contracts.map((contract: Contract) => (
                    <tr
                      key={contract._id}
                      className="border-b border-[#313442] hover:bg-[#313442] transition-all duration-200"
                    >
                      <td className="py-2 px-2 text-[#F1F1F1] font-medium text-sm">
                        {contract.fileName}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownloadContract(contract)}
                            disabled={deleteContractPending}
                            className="text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Télécharger
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteContract(contract._id)}
                            disabled={deleteContractPending}
                            className="text-xs border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/*
            SECTION NDA
        */}
        <div className="bg-[#1F2128] backdrop-blur-sm rounded-2xl border border-[#313442] p-3 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#F1F1F1] flex items-center gap-2">
              Mon NDA (Non-Disclosure Agreement)
            </h3>
            <Button
              onClick={onGenerateNda}
              disabled={generateNdaPending}
              className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              {generateNdaPending ? "Génération..." : "Générer mon NDA"}
            </Button>
          </div>

          {ndasLoading ? (
            /* ── Chargement ── */
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-purple-200 border-t-purple-600 mx-auto" />
              <p className="text-[#F1F1F1] mt-2 font-medium text-sm">
                Chargement du NDA...
              </p>
            </div>
          ) : ndas.length === 0 ? (
            /* ── Aucun NDA ── */
            <div className="text-center py-6 bg-[#1F2128] rounded-xl">
              <FileText className="mx-auto h-10 w-10 text-[#F1F1F1]" />
              <p className="mt-3 text-[#F1F1F1] font-medium text-sm">
                Aucun NDA généré
              </p>
              <p className="text-xs text-[#F1F1F1] mt-1">
                Cliquez sur "Générer mon NDA" pour créer votre accord de
                confidentialité
              </p>
            </div>
          ) : (
            /* ── Liste des NDAs (affichage normal) ── */
            <div className="overflow-x-auto rounded-xl border border-[#313442]">
              <table className="w-full">
                <tbody>
                  {ndas.map((nda) => (
                    <tr
                      key={nda._id}
                      className="border-b border-[#313442] hover:bg-[#313442] transition-all duration-200"
                    >
                      <td className="py-2 px-2 text-[#F1F1F1] font-medium text-sm font-mono">
                        {nda.fileName}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownloadNda(nda)}
                            disabled={deleteNdaPending}
                            className="text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Télécharger
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteNda(nda._id)}
                            disabled={deleteNdaPending}
                            className="text-xs border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/*
          SECTION DOCUMENTS PERSONNELS
      */}
      <div className="bg-[#1F2128] backdrop-blur-sm rounded-2xl border border-[#313442] p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Mes Documents</h3>
          <Button
            onClick={onAddDocument}
            className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </div>

        {documentsLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600 mx-auto" />
            <p className="text-[#F1F1F1] mt-2 font-medium text-sm">
              Chargement des documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 bg-[#303237] rounded-xl">
            <Upload className="mx-auto h-10 w-10 text-[#F1F1F1]" />
            <p className="mt-3 text-[#F1F1F1] font-medium text-sm">
              Aucun document uploadé
            </p>
            <p className="text-xs text-[#F1F1F1] mt-1">
              Cliquez sur "Ajouter un document" pour uploader vos premiers
              documents
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {documents.map((doc: Document) => (
              <Card
                key={doc._id}
                className="border-[#313442] hover:shadow-xl hover:shadow-[#313442] transition-all duration-300 hover:scale-105 bg-[#1F2128] backdrop-blur-sm"
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-sm bg-gray-500/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-8 h-8 text-[#6C4EA8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">
                        {doc.originalName}
                      </h4>
                      <p className="text-xs text-[#F1F1F1] mt-1">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#313442]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadDocument(doc)}
                      disabled={deleteDocumentPending}
                      className="text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteDocument(doc._id)}
                      disabled={deleteDocumentPending}
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

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-[#313442] bg-gradient-to-br bg-[#1F2128] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#F1F1F1] font-medium">
                  Documents uploadés
                </p>
                <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {documents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}