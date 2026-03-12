"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Shield,
  GraduationCap,
  Briefcase,
  Camera,
  X,
  ChevronRight,
  ChevronLeft,
  FileSignature,
  Eye,
  EyeOff,
  Check,
  User,
} from "lucide-react";
import { authService, type RegisterData } from "@/lib/auth-service";

// ─── Types ──────────────────────────────────────────────────────────────────
type UserRole = "collaborateur" | "manager";
type UserProfile = "stagiaire" | "prestataire";

// ─── Step configs ────────────────────────────────────────────────────────────
// Steps common to all flows: role → profile → ...form steps
const COMMON_STEPS = [
  { id: "role-select", label: "Rôle" },
  { id: "profile-select", label: "Profil" },
];

const STAGIAIRE_FORM_STEPS = [
  { id: "info-perso", label: "Informations personnelles" },
  { id: "info-pro", label: "Informations professionnelles" },
  { id: "coordonnees", label: "Coordonnées" },
  { id: "securite", label: "Sécurité" },
  { id: "signature", label: "Signature" },
];

const PRESTATAIRE_FORM_STEPS = [
  { id: "info-perso", label: "Informations personnelles" },
  { id: "info-pro", label: "Informations professionnelles" },
  { id: "prestation", label: "Information de Prestation" },
  { id: "coordonnees", label: "Coordonnées" },
  { id: "securite", label: "Sécurité" },
  { id: "signature", label: "Signature" },
];

// ─── Initial form state ──────────────────────────────────────────────────────
const initialForm = {
  nom: "",
  prenoms: "",
  dateNaissance: "",
  genre: "" as "Homme" | "Femme" | "",
  adresseLot: "",
  cin: "",
  poste: "",
  mission: "",
  domainePrestation: "",
  horaire: "" as "temps plein" | "temps partiel" | "",
  nombreJour: "" as string,
  dateDebut: "",
  dateFin: "",
  dateFinIndeterminee: false,
  tjm: "" as string,
  telephone: "",
  email: "",
  password: "",
  confirmPassword: "",
  indemnite: "" as string,
  indemniteConnexion: "" as string,
  dureeJournaliere: "" as string,
  tarifsHoraire: "" as string,
  profilePhoto: null as File | null,
  profilePhotoPreview: "",
  signature: null as File | null,
  signaturePreview: "",
};

// ─── Field component ──────────────────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs tracking-wider text-white">
        {label}
        {required && <span className="text-[#8254ff] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-[#111111] text-white placeholder-gray-600 border border-[#2a2a2a] rounded-sm px-3 py-2.5 outline-none focus:border-[#8254ff] focus:bg-[#0d0d0d] transition-all duration-200 text-sm ${className}`}
    />
  );
}

function Select({
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-[#111111] text-white border border-[#2a2a2a] rounded-sm px-3 py-2.5 outline-none focus:border-[#8254ff] transition-all duration-200 text-sm appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

// ─── Role/Profile Card ────────────────────────────────────────────────────────
function SelectionCard({
  icon,
  label,
  desc,
  color,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  color: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-sm border transition-all duration-200 group w-sm ${
        selected
          ? "border-white bg-[#8254ff]/10"
          : "border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#8254ff] hover:bg-[#0d0d0d]"
      }`}
    >
      <div
        className="w-12 h-12 rounded-sm flex items-center justify-center transition-colors"
        style={{ background: `${color}15` }}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="text-xs text-gray-600 mt-0.5">{desc}</div>}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Build the full steps array dynamically
  const formSteps =
    userProfile === "stagiaire"
      ? STAGIAIRE_FORM_STEPS
      : userProfile === "prestataire"
        ? PRESTATAIRE_FORM_STEPS
        : STAGIAIRE_FORM_STEPS; // fallback before profile chosen

  const steps = [...COMMON_STEPS, ...formSteps];
  const totalSteps = steps.length;
  const stepId = steps[currentStep]?.id;
  const isLastStep = currentStep === totalSteps - 1;

  // ── Helpers ──
  const setField = (key: keyof typeof form, val: unknown) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const transition = useCallback(
    (dir: "left" | "right", cb: () => void) => {
      if (isAnimating) return;
      setAnimDir(dir);
      setIsAnimating(true);
      setTimeout(() => {
        cb();
        setIsAnimating(false);
      }, 320);
    },
    [isAnimating],
  );

  // ── Validation per step ──
  const validateStep = (): boolean => {
    const e: Record<string, string> = {};

    if (stepId === "role-select") {
      if (!userRole) e.role = "Veuillez sélectionner un rôle";
    }

    if (stepId === "profile-select") {
      if (!userProfile) e.profile = "Veuillez sélectionner un profil";
    }

    if (stepId === "info-perso") {
      if (!form.nom.trim()) e.nom = "Requis";
      if (!form.prenoms.trim()) e.prenoms = "Requis";
      if (!form.dateNaissance) e.dateNaissance = "Requis";
      if (!form.genre) e.genre = "Requis";
      if (!form.adresseLot.trim()) e.adresseLot = "Requis";
      if (!form.cin.trim()) e.cin = "Requis";
    }

    if (stepId === "info-pro") {
      if (!form.poste.trim()) e.poste = "Requis";
      if (!form.dateDebut) e.dateDebut = "Requis";
      if (!form.dateFinIndeterminee && !form.dateFin)
        e.dateFin = "Requis ou cochez indéterminée";
      if (userProfile === "stagiaire") {
        if (!form.mission.trim()) e.mission = "Requis";
        if (!form.indemnite) e.indemnite = "Requis";
        if (!form.indemniteConnexion) e.indemniteConnexion = "Requis";
      }
      if (userProfile === "prestataire") {
        if (!form.tjm) e.tjm = "Requis";
      }
    }

    if (stepId === "prestation") {
      if (!form.domainePrestation.trim()) e.domainePrestation = "Requis";
      if (!form.horaire) e.horaire = "Requis";
      if (!form.nombreJour) e.nombreJour = "Requis";
      if (!form.dureeJournaliere) e.dureeJournaliere = "Requis";
      if (!form.tarifsHoraire) e.tarifsHoraire = "Requis";
    }

    if (stepId === "coordonnees") {
      if (!form.telephone.trim()) e.telephone = "Requis";
      if (!form.email.trim()) e.email = "Requis";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email invalide";
    }

    if (stepId === "securite") {
      if (!form.password) e.password = "Requis";
      else if (form.password.length < 6) e.password = "6 caractères minimum";
      if (!form.confirmPassword) e.confirmPassword = "Requis";
      else if (form.password !== form.confirmPassword)
        e.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (stepId === "signature") {
      if (!form.signature) e.signature = "La signature est obligatoire";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (currentStep < totalSteps - 1) {
      transition("right", () => setCurrentStep((s) => s + 1));
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      transition("left", () => setCurrentStep((s) => s - 1));
    }
  };

  // ── Photo handlers ──
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Image requise");
      return;
    }
    setField("profilePhoto", file);
    const reader = new FileReader();
    reader.onload = (ev) =>
      setField("profilePhotoPreview", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Image requise");
      return;
    }
    setField("signature", file);
    const reader = new FileReader();
    reader.onload = (ev) =>
      setField("signaturePreview", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!userRole || !userProfile) return;

    setIsLoading(true);
    try {
      const registerData: RegisterData = {
        role: userRole,
        profile: userProfile,
        nom: form.nom,
        prenoms: form.prenoms,
        dateNaissance: form.dateNaissance,
        genre: form.genre as "Homme" | "Femme",
        adresse: form.adresseLot,
        cin: form.cin,
        poste: form.poste,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
        dateFinIndeterminee: form.dateFinIndeterminee,
        tjm: Number(form.tjm) || 0,
        telephone: form.telephone,
        email: form.email,
        password: form.password,
        ...(userProfile === "stagiaire" && {
          mission: form.mission,
          indemnite: Number(form.indemnite),
          indemniteConnexion: Number(form.indemniteConnexion),
        }),
        ...(userProfile === "prestataire" && {
          domainePrestation: form.domainePrestation,
          dureeJournaliere: Number(form.dureeJournaliere),
          horaire: form.horaire as "temps plein" | "temps partiel",
          nombreJour: Number(form.nombreJour),
        }),
      };

      setLoadingMsg("Création du compte...");
      const response = await authService.register(registerData);
      const { token, user } = response;
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(user));
      const userId = user._id;
      const authHeaders = { Authorization: `Bearer ${token}` };

      setLoadingMsg("Upload de la signature...");
      if (form.signature) {
        const fd = new FormData();
        fd.append("signature", form.signature);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/signature`,
          { method: "POST", headers: authHeaders, body: fd },
        );
        if (res.ok) {
          const updated = await res.json();
          localStorage.setItem("userData", JSON.stringify(updated));
        }
      }

      if (form.profilePhoto) {
        setLoadingMsg("Upload de la photo...");
        const fd = new FormData();
        fd.append("photo", form.profilePhoto);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/profile-photo`,
          { method: "POST", headers: authHeaders, body: fd },
        );
        if (res.ok) {
          const updated = await res.json();
          localStorage.setItem("userData", JSON.stringify(updated));
        }
      }

      // setLoadingMsg("Génération du contrat...");
      // await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL}/contracts/generate-after-signup/${userId}`,
      //   {
      //     method: "POST",
      //     headers: { ...authHeaders, "Content-Type": "application/json" },
      //   },
      // );

      // setLoadingMsg("Génération du NDA...");
      // await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL}/ndas/generate/${userId}`,
      //   {
      //     method: "POST",
      //     headers: { ...authHeaders, "Content-Type": "application/json" },
      //   },
      // );

      router.push("/home");
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
      setLoadingMsg("");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#110521] px-4 py-8">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-8 flex flex-col items-center gap-4 max-w-xs w-full">
            <div className="w-10 h-10 border-2 border-[#8254ff] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-300">{loadingMsg}</p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Image src="/images/logo2.png" width={52} height={52} alt="Logo" />
            <span className="text-white font-bold text-xl tracking-wide">
              OPSIDE - CODE TALENT
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userProfile === "stagiaire" ? (
              <GraduationCap size={20} className="text-white" />
            ) : userProfile === "prestataire" ? (
              <Briefcase size={20} className="text-white" />
            ) : userRole ? (
              userRole === "manager" ? (
                <Shield size={20} className="text-white" />
              ) : (
                <Users size={20} className="text-white" />
              )
            ) : null}
            <span className="text-sm text-white capitalize">
              {userProfile ?? userRole ?? "Inscription"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="h-1 flex-1 rounded-full overflow-hidden bg-[#2a2a2a]"
            >
              <div
                className="h-full bg-[#8254ff] transition-all duration-500 ease-out"
                style={{ width: i <= currentStep ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-white font-bold uppercase tracking-wider">
            {steps[currentStep].label}
          </span>
          <span className="text-sm text-white">
            Étape {currentStep + 1}/{totalSteps}
          </span>
        </div>

        {/* Card */}
        <div className="bg-black rounded-xl py-7 px-8 overflow-hidden relative min-h-[420px] flex flex-col">
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(60px); opacity: 0; }
              to   { transform: translateX(0);   opacity: 1; }
            }
            @keyframes slideInLeft {
              from { transform: translateX(-60px); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
            .slide-right { animation: slideInRight 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
            .slide-left  { animation: slideInLeft  0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
          `}</style>

          <div
            key={`${stepId}-${currentStep}`}
            className={`flex-1 flex flex-col ${
              isAnimating
                ? animDir === "right"
                  ? "slide-right"
                  : "slide-left"
                : ""
            }`}
          >
            {/* ── Step 1: Role select ── */}
            {stepId === "role-select" && (
              <StepWrapper title="Sélectionnez votre rôle chez code talent">
                <div className="flex justify-center gap-3 mt-10">
                  <SelectionCard
                    icon={<Users size={28} color="white" />}
                    label="Collaborateur"
                    color="#3b82f6"
                    selected={userRole === "collaborateur"}
                    onClick={() => setUserRole("collaborateur")}
                  />
                  <SelectionCard
                    icon={<Shield size={28} color="white" />}
                    label="Manager"
                    color="#3b82f6"
                    selected={userRole === "manager"}
                    onClick={() => setUserRole("manager")}
                  />
                </div>
                {errors.role && (
                  <p className="text-xs text-red-400 mt-3">{errors.role}</p>
                )}
              </StepWrapper>
            )}

            {/* ── Step 2: Profile select ── */}
            {stepId === "profile-select" && (
              <StepWrapper title="Quel est votre profil ?">
                <p className="text-xs text-white mb-6 -mt-3">
                  Rôle sélectionné :{" "}
                  <span className="text-[#8254ff] font-medium capitalize">
                    {userRole === "collaborateur" ? "Collaborateur" : "Manager"}
                  </span>
                </p>
                <div className="flex justify-center gap-3 mt-10">
                  <SelectionCard
                    icon={<GraduationCap size={28} color="white" />}
                    label="Stagiaire"
                    color="#3b82f6"
                    selected={userProfile === "stagiaire"}
                    onClick={() => setUserProfile("stagiaire")}
                  />
                  <SelectionCard
                    icon={<Briefcase size={28} color="white" />}
                    label="Prestataire"
                    color="#3b82f6"
                    selected={userProfile === "prestataire"}
                    onClick={() => setUserProfile("prestataire")}
                  />
                </div>
                {errors.profile && (
                  <p className="text-xs text-red-400 mt-3">{errors.profile}</p>
                )}
              </StepWrapper>
            )}

            {/* ── Step: Info Perso ── */}
            {stepId === "info-perso" && (
              <StepWrapper title="">
                {/* Photo upload */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative flex-shrink-0 cursor-pointer">
                    <div
                      className="w-26 h-26 rounded-full bg-[#111] border border-[#2a2a2a] overflow-hidden flex items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {form.profilePhotoPreview ? (
                        <img
                          src={form.profilePhotoPreview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={38} className="text-gray-600" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 w-6 h-6 bg-[#8254ff] rounded-full flex items-center justify-center hover:bg-[#6d46d9] transition-colors cursor-pointer"
                    >
                      <Camera size={12} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">
                      Photo de profil
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Optionnel · Max 5MB
                    </p>
                    {form.profilePhotoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setField("profilePhoto", null);
                          setField("profilePhotoPreview", "");
                        }}
                        className="text-xs text-red-500 hover:text-red-400 mt-1 flex items-center gap-1"
                      >
                        <X size={10} /> Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom" required error={errors.nom}>
                    <Input
                      placeholder="Rakoto"
                      value={form.nom}
                      onChange={(e) => setField("nom", e.target.value)}
                    />
                  </Field>
                  <Field label="Prénom(s)" required error={errors.prenoms}>
                    <Input
                      placeholder="Jean"
                      value={form.prenoms}
                      onChange={(e) => setField("prenoms", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Date de naissance"
                    required
                    error={errors.dateNaissance}
                  >
                    <Input
                      type="date"
                      value={form.dateNaissance}
                      onChange={(e) =>
                        setField("dateNaissance", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Genre" required error={errors.genre}>
                    <Select
                      value={form.genre}
                      onChange={(e) => setField("genre", e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Adresse"
                    required
                    error={errors.adresseLot}
                  >
                    <Input
                      placeholder="Lot II M 45"
                      value={form.adresseLot}
                      onChange={(e) => setField("adresseLot", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field label="N° CIN" required error={errors.cin}>
                    <Input
                      placeholder="101 234 567 890"
                      value={form.cin}
                      onChange={(e) => setField("cin", e.target.value)}
                    />
                  </Field>
                </div>
              </StepWrapper>
            )}

            {/* ── Step: Info Pro ── */}
            {stepId === "info-pro" && (
              <StepWrapper title="">
                <Field label="Poste" required error={errors.poste}>
                  <Input
                    placeholder={
                      userProfile === "stagiaire"
                        ? "Stagiaire développeur"
                        : "Consultant IT"
                    }
                    value={form.poste}
                    onChange={(e) => setField("poste", e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Date de début"
                    required
                    error={errors.dateDebut}
                  >
                    <Input
                      type="date"
                      value={form.dateDebut}
                      onChange={(e) => setField("dateDebut", e.target.value)}
                    />
                  </Field>
                  <Field label="Date de fin" error={errors.dateFin}>
                    <Input
                      type="date"
                      value={form.dateFin}
                      onChange={(e) => setField("dateFin", e.target.value)}
                      disabled={form.dateFinIndeterminee}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <div
                    onClick={() =>
                      setField("dateFinIndeterminee", !form.dateFinIndeterminee)
                    }
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                      form.dateFinIndeterminee
                        ? "bg-[#8254ff] border-[#8254ff]"
                        : "border-[#2a2a2a]"
                    }`}
                  >
                    {form.dateFinIndeterminee && <Check size={10} />}
                  </div>
                  <span className="text-xs text-gray-400">
                    Date de fin indéterminée
                  </span>
                </label>

                {userProfile === "stagiaire" && (
                  <>
                    <div className="mt-3">
                      <Field label="Mission" required error={errors.mission}>
                        <Input
                          placeholder="Développement application web"
                          value={form.mission}
                          onChange={(e) => setField("mission", e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Field
                        label="Indemnité (Ar)"
                        required
                        error={errors.indemnite}
                      >
                        <Input
                          type="number"
                          placeholder="200 000"
                          value={form.indemnite}
                          onChange={(e) =>
                            setField("indemnite", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Indemn. connexion (Ar)"
                        required
                        error={errors.indemniteConnexion}
                      >
                        <Input
                          type="number"
                          placeholder="50 000"
                          value={form.indemniteConnexion}
                          onChange={(e) =>
                            setField("indemniteConnexion", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </>
                )}

                {userProfile === "prestataire" && (
                  <div className="mt-3">
                    <Field
                      label="TJM — Taux Journalier (Ar)"
                      required
                      error={errors.tjm}
                    >
                      <Input
                        type="number"
                        placeholder="50 000"
                        value={form.tjm}
                        onChange={(e) => setField("tjm", e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </StepWrapper>
            )}

            {/* ── Step: Prestation (prestataire only) ── */}
            {stepId === "prestation" && (
              <StepWrapper title="">
                <Field
                  label="Domaine de prestation"
                  required
                  error={errors.domainePrestation}
                >
                  <Input
                    placeholder="Développement web, Design, Consulting..."
                    value={form.domainePrestation}
                    onChange={(e) =>
                      setField("domainePrestation", e.target.value)
                    }
                  />
                </Field>

                <div className="mt-3">
                  <Field
                    label="Type de travail"
                    required
                    error={errors.horaire}
                  >
                    <Select
                      value={form.horaire}
                      onChange={(e) => setField("horaire", e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      <option value="temps plein">temps plein</option>
                      <option value="temps partiel">temps partiel</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Nombre de jours de travail par semaine"
                    required
                    error={errors.nombreJour}
                  >
                    <Select
                      value={form.nombreJour}
                      onChange={(e) => setField("nombreJour", e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n} jour{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Durée journalière (h)"
                    required
                    error={errors.dureeJournaliere}
                  >
                    <Input
                      type="number"
                      placeholder="8"
                      min="1"
                      max="24"
                      value={form.dureeJournaliere}
                      onChange={(e) =>
                        setField("dureeJournaliere", e.target.value)
                      }
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field
                    label="Tarif horaire (Ar)"
                    required
                    error={errors.tarifsHoraire}
                  >
                    <Input
                      type="number"
                      placeholder="6 250"
                      value={form.tarifsHoraire}
                      onChange={(e) =>
                        setField("tarifsHoraire", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </StepWrapper>
            )}

            {/* ── Step: Coordonnées ── */}
            {stepId === "coordonnees" && (
              <StepWrapper title="Coordonnées">
                <div className="space-y-4">
                  <Field
                    label="Numéro de téléphone"
                    required
                    error={errors.telephone}
                  >
                    <Input
                      type="tel"
                      placeholder="+261 34 12 345 67"
                      value={form.telephone}
                      onChange={(e) => setField("telephone", e.target.value)}
                    />
                  </Field>
                  <Field label="Adresse e-mail" required error={errors.email}>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </Field>
                </div>
                <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                  Ces informations seront utilisées pour vous contacter et
                  accéder à votre espace.
                </p>
              </StepWrapper>
            )}

            {/* ── Step: Sécurité ── */}
            {stepId === "securite" && (
              <StepWrapper title="Sécurité du compte">
                <div className="space-y-4">
                  <Field label="Mot de passe" required error={errors.password}>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </Field>
                  <Field
                    label="Confirmer le mot de passe"
                    required
                    error={errors.confirmPassword}
                  >
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setField("confirmPassword", e.target.value)
                        }
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                </div>
                <div className="mt-4 p-3 rounded-sm bg-[#111] border border-[#2a2a2a]">
                  <p className="text-xs text-gray-500">Minimum 6 caractères</p>
                </div>
              </StepWrapper>
            )}

            {/* ── Step: Signature ── */}
            {stepId === "signature" && (
              <StepWrapper title="Signature électronique">
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                  Votre signature sera intégrée dans votre contrat et votre NDA.
                  Elle doit être lisible sur fond blanc ou transparent.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <div
                    onClick={() => signatureInputRef.current?.click()}
                    className={`w-full h-32 rounded-sm border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                      errors.signature
                        ? "border-red-500"
                        : "border-[#2a2a2a] hover:border-[#8254ff]"
                    } bg-[#0a0a0a]`}
                  >
                    {form.signaturePreview ? (
                      <img
                        src={form.signaturePreview}
                        alt="Signature"
                        className="max-h-28 max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <FileSignature size={28} />
                        <span className="text-xs">Cliquer pour uploader</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignature}
                    className="hidden"
                  />

                  {form.signaturePreview ? (
                    <div className="flex items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="flex-1 py-2 text-xs border border-[#2a2a2a] rounded-sm text-gray-400 hover:border-[#8254ff] hover:text-white transition-colors"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setField("signature", null);
                          setField("signaturePreview", "");
                        }}
                        className="flex-1 py-2 text-xs border border-red-900 rounded-sm text-red-500 hover:bg-red-950 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  {errors.signature && (
                    <p className="text-xs text-red-400 self-start">
                      {errors.signature}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Formats : JPG, PNG · Max 2MB
                </p>
              </StepWrapper>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1a1a1a]">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-400 border border-[#2a2a2a] rounded-sm hover:border-gray-500 hover:text-gray-200 transition-colors"
              >
                <ChevronLeft size={15} />
                Retour
              </button>
            ) : null}

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-[#8254ff] hover:bg-[#6d46d9] text-white rounded-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingMsg || "Création..."}
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Créer mon compte
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-[#8254ff] hover:bg-[#6d46d9] text-white rounded-sm transition-colors px-10"
              >
                Continuer
              </button>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-sm text-gray-600">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-[#8254ff] hover:text-purple-300"
            >
              Se connecter
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-base font-semibold text-white mb-5">{title}</h2>
      <div className="flex-1">{children}</div>
    </div>
  );
}
