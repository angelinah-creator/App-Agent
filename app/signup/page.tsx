"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService, type RegisterData } from "@/lib/auth-service";
import {
  GraduationCap,
  Briefcase,
  Calendar,
  MapPin,
  FileText,
  Phone,
  Mail,
  Key,
  Upload,
  X,
  PenTool,
  AlertCircle,
} from "lucide-react";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<"stagiaire" | "prestataire" | null>(
    null
  );
  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    dateNaissance: "",
    genre: "" as "Homme" | "Femme",
    adresseLot: "",
    adresseFokontany: "",
    cin: "",
    poste: "",
    mission: "",
    domainePrestation: "",
    dateDebut: "",
    dateFin: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    indemnite: 0,
    indemniteConnexion: 0,
    tarifJournalier: 0,
    dureeJournaliere: 0,
    tarifHoraire: 0,
    nombreJour: 0,
    horaire: "",
  });

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string>("");
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setSignatureError("Format invalide. Utilisez PNG, JPG ou JPEG.");
      return;
    }

    if (file.size > maxSize) {
      setSignatureError("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSignaturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSignatureFile(file);
    setSignatureError("");
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      confirm({
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas",
        confirmText: "OK",
        onConfirm: () => {},
      });
      return;
    }

    if (!signatureFile) {
      setSignatureError("La signature est obligatoire.");
      return;
    }

    if (!userType) {
      alert("Veuillez sélectionner un type de profil");
      return;
    }

    setIsLoading(true);

    try {
      const adresse = `${formData.adresseLot}, ${formData.adresseFokontany}`;

      const dateFinIndeterminee = !formData.dateFin; // Si dateFin est vide => indéterminée

      const registerData: RegisterData = {
        profile: userType,
        nom: formData.nom,
        prenoms: formData.prenoms,
        dateNaissance: formData.dateNaissance,
        genre: formData.genre,
        adresse: adresse,
        cin: formData.cin,
        poste: formData.poste,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin || undefined,
        dateFinIndeterminee: dateFinIndeterminee,
        telephone: formData.telephone,
        email: formData.email,
        password: formData.password,
        ...(userType === "stagiaire" && {
          mission: formData.mission,
          indemnite: formData.indemnite,
          indemniteConnexion: formData.indemniteConnexion,
        }),
        ...(userType === "prestataire" && {
          domainePrestation: formData.domainePrestation,
          tarifJournalier: formData.tarifJournalier,
          dureeJournaliere: formData.dureeJournaliere,
          tarifHoraire: formData.tarifHoraire,
          nombreJour: formData.nombreJour,
          horaire: formData.horaire,
        }),
      };

      // Inscription en une seule étape !
      const response = await authService.registerWithSignature(
        registerData,
        signatureFile
      );

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de l'inscription";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type: "stagiaire" | "prestataire" | null) => {
    setUserType(type);
    setFormData((prev) => ({
      ...prev,
      mission: "",
      domainePrestation: "",
      indemnite: 0,
      indemniteConnexion: 0,
      tarifJournalier: 0,
      dureeJournaliere: 0,
    }));
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const SignatureSection = () => (
    <div className="space-y-4 p-4 mt-10">
      <div className="flex items-center gap-2">
        <PenTool className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-slate-800">Signature Digitale *</h3>
      </div>

      <p className="text-sm text-slate-600">
        Téléchargez une image de votre signature (PNG, JPG, JPEG - max 10 Mo)
      </p>

      {signatureError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {signatureError}
        </div>
      )}

      <div className="space-y-3">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors bg-white">
          {signaturePreview ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={signaturePreview}
                  alt="Signature preview"
                  className="max-h-32 mx-auto border border-slate-200 rounded"
                />
                <button
                  type="button"
                  onClick={removeSignature}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600">
                {signatureFile?.name} (
                {(signatureFile?.size! / 1024).toFixed(2)} KB)
              </p>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={signatureInputRef}
                onChange={handleSignatureChange}
                accept=".png,.jpg,.jpeg"
                className="hidden"
                id="signature-upload"
              />
              <label
                htmlFor="signature-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-slate-700 font-medium">
                  Cliquez pour télécharger votre signature
                </span>
                <span className="text-sm text-slate-500">
                  PNG, JPG, JPEG - Max 10 Mo
                </span>
              </label>
            </>
          )}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>Conseils pour votre signature :</p>
          <ul className="list-disc list-inside pl-2">
            <li>Utilisez un fond blanc ou transparent</li>
            <li>La signature doit être claire et lisible</li>
            <li>Format recommandé : PNG avec transparence</li>
            <li>Taille recommandée : 500x200 pixels</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 relative overflow-hidden">
      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-balance bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
            OPSIDE
          </h1>
          <p className="text-slate-600 text-lg">Créez votre compte agent</p>
        </div>

        <Card className="border-slate-200/60 shadow-2xl backdrop-blur-xl bg-white/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Inscription
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sélectionnez votre type de profil et remplissez le formulaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!userType ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">
                    Quel est votre profil ?
                  </h3>
                  <p className="text-sm text-slate-600">
                    Choisissez le type de compte à créer
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 shadow-md hover:shadow-xl"
                    onClick={() => handleUserTypeChange("stagiaire")}
                  >
                    <GraduationCap className="w-16 h-16 text-blue-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Stagiaire
                      </div>
                      <div className="text-xs text-slate-600">
                        Stage ou mission temporaire
                      </div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 shadow-md hover:shadow-xl"
                    onClick={() => handleUserTypeChange("prestataire")}
                  >
                    <Briefcase className="w-16 h-16 text-purple-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Prestataire
                      </div>
                      <div className="text-xs text-slate-600">
                        Prestation de service
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    {userType === "stagiaire" ? (
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    )}
                    <span className="font-semibold capitalize text-slate-800">
                      {userType}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUserTypeChange(null)}
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  >
                    Changer
                  </Button>
                </div>

                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                    <PenTool className="w-5 h-5 text-purple-600" />
                    Informations personnelles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom" className="text-slate-700">
                        Nom *
                      </Label>
                      <Input
                        id="nom"
                        type="text"
                        placeholder="Rakoto"
                        value={formData.nom}
                        onChange={(e) =>
                          handleInputChange("nom", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prenoms" className="text-slate-700">
                        Prénom(s) *
                      </Label>
                      <Input
                        id="prenoms"
                        type="text"
                        placeholder="Jean"
                        value={formData.prenoms}
                        onChange={(e) =>
                          handleInputChange("prenoms", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateNaissance" className="text-slate-700">
                        Date de naissance *
                      </Label>
                      <Input
                        id="dateNaissance"
                        type="date"
                        value={formData.dateNaissance}
                        onChange={(e) =>
                          handleInputChange("dateNaissance", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="genre" className="text-slate-700">
                        Genre *
                      </Label>
                      <Select
                        value={formData.genre}
                        onValueChange={(value: "Homme" | "Femme") =>
                          handleInputChange("genre", value)
                        }
                      >
                        <SelectTrigger className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Homme">Homme</SelectItem>
                          <SelectItem value="Femme">Femme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adresseLot" className="text-slate-700">
                        Adresse - Lot *
                      </Label>
                      <Input
                        id="adresseLot"
                        type="text"
                        placeholder="Lot II M 45"
                        value={formData.adresseLot}
                        onChange={(e) =>
                          handleInputChange("adresseLot", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="adresseFokontany"
                        className="text-slate-700"
                      >
                        Adresse - Fokontany *
                      </Label>
                      <Input
                        id="adresseFokontany"
                        type="text"
                        placeholder="Ambohipo"
                        value={formData.adresseFokontany}
                        onChange={(e) =>
                          handleInputChange("adresseFokontany", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cin" className="text-slate-700">
                      CIN *
                    </Label>
                    <Input
                      id="cin"
                      type="text"
                      placeholder="101 234 567 890"
                      value={formData.cin}
                      onChange={(e) => handleInputChange("cin", e.target.value)}
                      required
                      className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                    />
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Informations professionnelles
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="poste" className="text-slate-700">
                      Poste *
                    </Label>
                    <Input
                      id="poste"
                      type="text"
                      placeholder="développeur"
                      value={formData.poste}
                      onChange={(e) =>
                        handleInputChange("poste", e.target.value)
                      }
                      required
                      className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateDebut" className="text-slate-700">
                        Date de début *
                      </Label>
                      <Input
                        id="dateDebut"
                        type="date"
                        value={formData.dateDebut}
                        onChange={(e) =>
                          handleInputChange("dateDebut", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFin" className="text-slate-700">
                        Date de fin (optionnel)
                      </Label>
                      <Input
                        id="dateFin"
                        type="date"
                        value={formData.dateFin}
                        onChange={(e) =>
                          handleInputChange("dateFin", e.target.value)
                        }
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        Laisser vide si la date de fin est indéterminée
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tarifJournalier" className="text-slate-700">
                      TJM (Taux Journalier Moyen) en Ar *
                    </Label>
                    <Input
                      id="tarifJournalier"
                      type="number"
                      placeholder="50000"
                      value={formData.tarifJournalier || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "tarifJournalier",
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      required
                      className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                    />
                  </div>
                </div>

                {/* Champs spécifiques */}
                {userType === "stagiaire" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Informations de stage
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="mission" className="text-slate-700">
                        Mission *
                      </Label>
                      <Input
                        id="mission"
                        type="text"
                        placeholder="Développement application web"
                        value={formData.mission}
                        onChange={(e) =>
                          handleInputChange("mission", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="indemnite" className="text-slate-700">
                          Indemnité (Ar) *
                        </Label>
                        <Input
                          id="indemnite"
                          type="number"
                          placeholder="200000"
                          value={formData.indemnite || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "indemnite",
                              Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="indemniteConnexion"
                          className="text-slate-700"
                        >
                          Indemnité de connexion (Ar) *
                        </Label>
                        <Input
                          id="indemniteConnexion"
                          type="number"
                          placeholder="50000"
                          value={formData.indemniteConnexion || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "indemniteConnexion",
                              Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {userType === "prestataire" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                      Informations de prestation
                    </h3>

                    <div className="space-y-2">
                      <Label
                        htmlFor="domainePrestation"
                        className="text-slate-700"
                      >
                        Domaine de la prestation *
                      </Label>
                      <Input
                        id="domainePrestation"
                        type="text"
                        placeholder="Développement web, Design, ..."
                        value={formData.domainePrestation}
                        onChange={(e) =>
                          handleInputChange("domainePrestation", e.target.value)
                        }
                        required
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="horaire" className="text-slate-700">
                          Type de travail *
                        </Label>
                        <Select
                          value={formData.horaire}
                          onValueChange={(value: string) =>
                            handleInputChange("horaire", value)
                          }
                        >
                          <SelectTrigger className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white">
                            <SelectValue placeholder="Sélectionner l'horaire" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="temps plein">
                              temps plein
                            </SelectItem>
                            <SelectItem value="temps partiel">
                              temps partiel
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nombreJour" className="text-slate-700">
                          Nombre de jours par semaine *
                        </Label>
                        <Input
                          id="nombreJour"
                          type="number"
                          placeholder="5"
                          min="1"
                          max="7"
                          value={formData.nombreJour || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "nombreJour",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="tarifHoraire"
                          className="text-slate-700"
                        >
                          Tarif horaire (Ar) *
                        </Label>
                        <Input
                          id="tarifHoraire"
                          type="number"
                          placeholder="10000"
                          value={formData.tarifHoraire || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "tarifHoraire",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="dureeJournaliere"
                          className="text-slate-700"
                        >
                          Durée journalière (heures) *
                        </Label>
                        <Input
                          id="dureeJournaliere"
                          type="number"
                          placeholder="8"
                          min="1"
                          max="24"
                          value={formData.dureeJournaliere || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "dureeJournaliere",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Coordonnées */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                    <Phone className="w-5 h-5 text-green-600" />
                    Coordonnées
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-slate-700">
                      Numéro de téléphone *
                    </Label>
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="+261 ..."
                      value={formData.telephone}
                      onChange={(e) =>
                        handleInputChange("telephone", e.target.value)
                      }
                      required
                      className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mt-10">
                    <Key className="w-5 h-5 text-amber-600" />
                    Sécurité
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">
                        Mot de passe *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        required
                        minLength={6}
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-slate-700"
                      >
                        Confirmer mot de passe *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        required
                        minLength={6}
                        className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <SignatureSection />

                <Button
                  type="submit"
                  className="w-full transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Création du compte...
                    </span>
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  Déjà un compte ?{" "}
                  <Link
                    href="/login"
                    className="text-purple-600 hover:text-purple-700 hover:underline font-medium transition-colors"
                  >
                    Se connecter
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {dialog}
    </div>
  );
}
