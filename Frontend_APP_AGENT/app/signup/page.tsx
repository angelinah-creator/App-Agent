"use client";

import type React from "react";

import { useState } from "react";
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
  User,
  Calendar,
  MapPin,
  FileText,
  Phone,
  Mail,
  Key,
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
    dateFinIndeterminee: false,
    tjm: 0,
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    indemnite: 0,
    indemniteConnexion: 0,
    tarifJournalier: 0,
    dureeJournaliere: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

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

    if (!userType) {
      alert("Veuillez sélectionner un type de profil");
      return;
    }

    setIsLoading(true);

    try {
      const adresse = `${formData.adresseLot}, ${formData.adresseFokontany}`;

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
        dateFinIndeterminee: formData.dateFinIndeterminee,
        tjm: formData.tjm,
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
        }),
      };

      const response = await authService.register(registerData);

      // Stocker le token et les données utilisateur
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      alert(error.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type: "stagiaire" | "prestataire" | null) => {
    setUserType(type);
    // Réinitialiser les champs spécifiques au profil
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 relative overflow-hidden">
      {/* Animated gradient orbs - softer colors for white background */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-indigo-200/40 via-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/40 via-emerald-200/40 to-green-200/40 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/3 right-1/4 w-[35rem] h-[35rem] bg-gradient-to-l from-rose-200/30 via-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Luxury grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Decorative corner elements with gold accent */}
      <div className="absolute top-0 right-0 w-40 h-40 border-r-2 border-t-2 border-amber-300/40 rounded-tr-[2.5rem]" />
      <div className="absolute bottom-0 left-0 w-40 h-40 border-l-2 border-b-2 border-amber-300/40 rounded-bl-[2.5rem]" />

      {/* Floating luxury shapes */}
      <div className="absolute top-20 left-20 w-3 h-3 bg-indigo-400/60 rounded-full animate-ping" />
      <div className="absolute bottom-32 right-32 w-4 h-4 bg-pink-400/60 rounded-full animate-ping delay-500" />
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-amber-400/60 rounded-full animate-ping delay-1000" />

      {/* Content */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-balance bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
            Agent Code Talent
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

                {/* Common fields */}
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
                      onChange={(e) => handleInputChange("nom", e.target.value)}
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

                <div className="space-y-2">
                  <Label htmlFor="poste" className="text-slate-700">
                    Poste *
                  </Label>
                  <Input
                    id="poste"
                    type="text"
                    placeholder={
                      userType === "stagiaire"
                        ? "Stagiaire développeur"
                        : "Consultant IT"
                    }
                    value={formData.poste}
                    onChange={(e) => handleInputChange("poste", e.target.value)}
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
                      Date de fin {userType === "prestataire" && "(optionnel)"}
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tjm" className="text-slate-700">
                    TJM (Taux Journalier Moyen) en Ar *
                  </Label>
                  <Input
                    id="tjm"
                    type="number"
                    placeholder="50000"
                    value={formData.tjm || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "tjm",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    required
                    className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                  />
                </div>

                {/* Stagiaire specific fields */}
                {userType === "stagiaire" && (
                  <>
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
                  </>
                )}

                {/* Prestataire specific fields */}
                {userType === "prestataire" && (
                  <>
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
                        placeholder="Développement web, Design, Consulting..."
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
                        <Label
                          htmlFor="tarifJournalier"
                          className="text-slate-700"
                        >
                          Tarif journalier (Ar) *
                        </Label>
                        <Input
                          id="tarifJournalier"
                          type="number"
                          placeholder="100000"
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
                          value={formData.dureeJournaliere || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "dureeJournaliere",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          required
                          className="transition-all duration-300 focus-scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-slate-700">
                    Numéro de téléphone *
                  </Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+261 34 12 345 67"
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
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
                  />
                </div>

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
                    <Label htmlFor="confirmPassword" className="text-slate-700">
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dateFinIndeterminee"
                    checked={formData.dateFinIndeterminee}
                    onChange={(e) =>
                      handleInputChange("dateFinIndeterminee", e.target.checked)
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="dateFinIndeterminee"
                    className="text-slate-700"
                  >
                    Date de fin indéterminée
                  </Label>
                </div>

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
    </div>
  );
}
