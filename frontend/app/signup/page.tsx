// frontend/app/signup/page.tsx
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
  Users,
  Shield,
  GraduationCap,
  Briefcase,
  User,
  Camera,
  ArrowLeft,
  X,
  FileSignature,
} from "lucide-react";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";

type UserRole = "collaborateur" | "manager";
type UserProfile = "stagiaire" | "prestataire";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "profile" | "form">("role");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Refs pour les inputs file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Champs pour la photo de profil
    profilePhoto: null as File | null,
    profilePhotoPreview: "",
    
    // AJOUT : Champs pour la signature
    signature: null as File | null,
    signaturePreview: "",
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

    // AJOUT : Validation signature obligatoire
    if (!formData.signature) {
      confirm({
        title: "Signature requise",
        description: "Veuillez uploader votre signature avant de continuer. Elle sera utilisée pour générer votre contrat.",
        confirmText: "OK",
        onConfirm: () => {},
      });
      return;
    }

    if (!userRole || !userProfile) {
      alert("Veuillez sélectionner un rôle et un profil");
      return;
    }

    setIsLoading(true);

    try {
      const adresse = `${formData.adresseLot}, ${formData.adresseFokontany}`;

      const registerData: RegisterData = {
        role: userRole,
        profile: userProfile,
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
        ...(userProfile === "stagiaire" && {
          mission: formData.mission,
          indemnite: formData.indemnite,
          indemniteConnexion: formData.indemniteConnexion,
        }),
        ...(userProfile === "prestataire" && {
          domainePrestation: formData.domainePrestation,
          tarifJournalier: formData.tarifJournalier,
          dureeJournaliere: formData.dureeJournaliere,
        }),
      };

      const response = await authService.register(registerData);

      // Stocker le token et les données utilisateur
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      // Si l'utilisateur a sélectionné une photo, l'uploader maintenant
      if (formData.profilePhoto && response.user._id) {
        try {
          const formDataPhoto = new FormData();
          formDataPhoto.append('photo', formData.profilePhoto);
          
          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${response.user._id}/profile-photo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${response.token}`,
            },
            body: formDataPhoto
          });
          
          if (uploadResponse.ok) {
            console.log("✅ Photo uploadée avec succès");
            const updatedUser = await uploadResponse.json();
            localStorage.setItem("userData", JSON.stringify(updatedUser));
          }
        } catch (uploadError) {
          console.error("❌ Erreur upload photo:", uploadError);
        }
      }

      // AJOUT : Upload de la signature (OBLIGATOIRE)
      if (formData.signature && response.user._id) {
        try {
          const formDataSignature = new FormData();
          formDataSignature.append('signature', formData.signature);
          
          const signatureResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${response.user._id}/signature`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${response.token}`,
            },
            body: formDataSignature
          });
          
          if (signatureResponse.ok) {
            console.log("✅ Signature uploadée avec succès");
            const updatedUser = await signatureResponse.json();
            localStorage.setItem("userData", JSON.stringify(updatedUser));
          } else {
            console.error("❌ Erreur lors de l'upload de la signature");
          }
        } catch (uploadError) {
          console.error("❌ Erreur upload signature:", uploadError);
        }
      }

      router.push("/home");
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      alert(error.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        alert("Le fichier doit être une image");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profilePhotoPreview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: null,
      profilePhotoPreview: ""
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // AJOUT : Fonctions de gestion de signature
  const handleSignatureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 2MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        alert("Le fichier doit être une image");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        signature: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          signaturePreview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({
      ...prev,
      signature: null,
      signaturePreview: ""
    }));
    
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setStep("profile");
  };

  const handleProfileSelect = (profile: UserProfile) => {
    setUserProfile(profile);
    setStep("form");
  };

  const handleBack = () => {
    if (step === "profile") {
      setStep("role");
      setUserProfile(null);
    } else if (step === "form") {
      setStep("profile");
    }
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

  const getProfileDescription = (profile: UserProfile) => {
    const descriptions = {
      stagiaire: "Stage ou mission temporaire avec indemnités",
      prestataire: "Prestation de service avec facturation",
    };
    return descriptions[profile];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 relative overflow-hidden">
      {dialog}
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-indigo-200/40 via-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/40 via-emerald-200/40 to-green-200/40 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/3 right-1/4 w-[35rem] h-[35rem] bg-gradient-to-l from-rose-200/30 via-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Luxury grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px]" />

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
              {step === "role" && "Choisissez votre rôle"}
              {step === "profile" && "Choisissez votre profil"}
              {step === "form" && "Informations personnelles"}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {step === "role" && "Sélectionnez votre rôle dans l'organisation"}
              {step === "profile" && "Choisissez votre type de contrat"}
              {step === "form" && `Remplissez vos informations - ${userRole} ${userProfile}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Étape 1: Sélection du rôle */}
            {step === "role" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">
                    Quel est votre rôle ?
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
                    onClick={() => handleRoleSelect("collaborateur")}
                  >
                    <Users className="w-16 h-16 text-blue-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Collaborateur
                      </div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 shadow-md hover:shadow-xl"
                    onClick={() => handleRoleSelect("manager")}
                  >
                    <Shield className="w-16 h-16 text-purple-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Manager
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Étape 2: Sélection du profil */}
            {step === "profile" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour
                  </Button>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold capitalize text-slate-800">
                      {userRole}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">
                    Quel est votre profil ?
                  </h3>
                  <p className="text-sm text-slate-600">
                    Choisissez votre type de contrat
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 shadow-md hover:shadow-xl"
                    onClick={() => handleProfileSelect("stagiaire")}
                  >
                    <GraduationCap className="w-16 h-16 text-blue-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Stagiaire
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {getProfileDescription("stagiaire")}
                      </div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] bg-white border-slate-200 shadow-md hover:shadow-xl"
                    onClick={() => handleProfileSelect("prestataire")}
                  >
                    <Briefcase className="w-16 h-16 text-purple-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg text-slate-800">
                        Prestataire
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {getProfileDescription("prestataire")}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Étape 3: Formulaire d'inscription */}
            {step === "form" && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* En-tête avec rôle et profil */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold capitalize text-slate-800">
                        {userRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {userProfile === "stagiaire" ? (
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      )}
                      <span className="font-semibold capitalize text-slate-800">
                        {userProfile}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour
                  </Button>
                </div>

                {/* Section Photo de profil */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">Photo de profil</h3>
                      <p className="text-sm text-slate-600">Optionnel - Taille max: 5MB</p>
                    </div>
                    {formData.profilePhotoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {formData.profilePhotoPreview ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-white shadow-lg">
                          <img 
                            src={formData.profilePhotoPreview} 
                            alt="Preview photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-3 border-white shadow-lg flex items-center justify-center">
                          <User className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {formData.profilePhotoPreview ? "Changer la photo" : "Ajouter une photo"}
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">
                        Formats acceptés: JPG, PNG, WebP
                      </p>
                      <p className="text-xs text-slate-500">
                        Votre photo apparaîtra dans votre profil et dans le header
                      </p>
                    </div>
                  </div>
                </div>

                {/* AJOUT : Section Signature électronique */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-purple-600" />
                        Signature électronique *
                      </h3>
                      <p className="text-sm text-slate-600">Requis - Utilisée pour générer votre contrat</p>
                    </div>
                    {formData.signaturePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveSignature}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {formData.signaturePreview ? (
                        <div className="w-48 h-24 rounded-lg overflow-hidden border-2 border-slate-200 bg-white shadow-sm">
                          <img 
                            src={formData.signaturePreview} 
                            alt="Preview signature"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-24 rounded-lg bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <FileSignature className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureSelect}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => signatureInputRef.current?.click()}
                        className="border-slate-200 hover:border-purple-400 text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {formData.signaturePreview ? "Changer la signature" : "Ajouter une signature"}
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">
                        Formats acceptés: JPG, PNG - Taille max: 2MB
                      </p>
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        ⚠️ Obligatoire pour la génération de votre contrat
                      </p>
                    </div>
                  </div>
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
                      userProfile === "stagiaire"
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
                      Date de fin {userProfile === "prestataire" && "(optionnel)"}
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
                {userProfile === "stagiaire" && (
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
                {userProfile === "prestataire" && (
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
                          className="transition-all duration-300 focus:scale-[1.01] border-slate-200 focus:border-blue-400 bg-white"
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