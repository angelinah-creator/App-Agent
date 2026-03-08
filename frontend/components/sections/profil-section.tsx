"use client";

import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  Edit2,
  Trash2,
  Lock,
  Save,
  X,
  Clock,
  Banknote,
  FileText,
  Wifi,
  CheckCircle,
  AlertCircle,
  Shield,
  PenLine,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth-service";
import { usersService } from "@/lib/users-service";

interface UserProfile {
  _id: string;
  role: "admin" | "manager" | "collaborateur" | "client";
  profile?: "stagiaire" | "prestataire";
  nom: string;
  prenoms: string;
  email: string;
  telephone: string;
  dateNaissance?: string;
  genre?: string;
  adresse?: string;
  cin?: string;
  poste?: string;
  dateDebut?: string;
  dateFin?: string;
  dateFinIndeterminee?: boolean;
  tjm?: number;
  mission?: string;
  indemnite?: number;
  indemniteConnexion?: number;
  domainePrestation?: string;
  dureeJournaliere?: number;
  nombreJour?: number;
  horaire?: string;
  profilePhoto?: { url: string; publicId: string };
  signature?: { url: string; publicId: string };
}

type EditSection =
  | "personal"
  | "professional"
  | "stagiaire"
  | "prestataire"
  | null;

export function Profil() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showSignatureViewer, setShowSignatureViewer] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [personalForm, setPersonalForm] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    genre: "",
    adresse: "",
    cin: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    poste: "",
    dateDebut: "",
    dateFin: "",
    dateFinIndeterminee: false,
    tjm: 0,
  });

  const [stagiaireForm, setStagiaireForm] = useState({
    mission: "",
    indemnite: 0,
    indemniteConnexion: 0,
  });

  const [prestataireForm, setPrestataireForm] = useState({
    domainePrestation: "",
    dureeJournaliere: 0,
    nombreJour: 0,
    horaire: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: rawUser, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
  });

  const user = rawUser as UserProfile | undefined;

  // --- Mutations ---
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) =>
      usersService.uploadProfilePhoto(user!._id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      showToast("Photo mise à jour");
    },
    onError: () => showToast("Erreur photo", false),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: () => usersService.deleteProfilePhoto(user!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowDeletePhotoConfirm(false);
      showToast("Photo supprimée");
    },
    onError: () => {
      setShowDeletePhotoConfirm(false);
      showToast("Erreur suppression photo", false);
    },
  });

  const uploadSignatureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("signature", file);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user!._id}/signature`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (!res.ok) throw new Error("Erreur upload signature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      showToast("Signature mise à jour");
    },
    onError: () => showToast("Erreur signature", false),
  });

  const updateInfoMutation = useMutation({
    mutationFn: (data: any) => usersService.updatePersonalInfo(user!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditSection(null);
      showToast("Informations mises à jour");
    },
    onError: () => showToast("Erreur mise à jour", false),
  });

  const updateFullMutation = useMutation({
    mutationFn: (data: any) => usersService.updateAgent(user!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditSection(null);
      showToast("Informations mises à jour");
    },
    onError: () => showToast("Erreur mise à jour", false),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      usersService.changePassword(
        user!._id,
        passwordForm.currentPassword,
        passwordForm.newPassword,
      ),
    onSuccess: () => {
      setChangingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Mot de passe modifié");
    },
    onError: () => showToast("Mot de passe actuel incorrect", false),
  });

  // --- Handlers ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Max 5MB", false);
      return;
    }
    uploadPhotoMutation.mutate(file);
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Max 2MB", false);
      return;
    }
    uploadSignatureMutation.mutate(file);
  };

  const openEdit = (section: EditSection) => {
    if (!user) return;
    if (section === "personal") {
      setPersonalForm({
        nom: user.nom || "",
        prenoms: user.prenoms || "",
        email: user.email || "",
        telephone: user.telephone || "",
        dateNaissance: user.dateNaissance
          ? user.dateNaissance.split("T")[0]
          : "",
        genre: user.genre || "",
        adresse: user.adresse || "",
        cin: user.cin || "",
      });
    }
    if (section === "professional") {
      setProfessionalForm({
        poste: user.poste || "",
        dateDebut: user.dateDebut ? user.dateDebut.split("T")[0] : "",
        dateFin: user.dateFin ? user.dateFin.split("T")[0] : "",
        dateFinIndeterminee: user.dateFinIndeterminee || false,
        tjm: user.tjm || 0,
      });
    }
    if (section === "stagiaire") {
      setStagiaireForm({
        mission: user.mission || "",
        indemnite: user.indemnite || 0,
        indemniteConnexion: user.indemniteConnexion || 0,
      });
    }
    if (section === "prestataire") {
      setPrestataireForm({
        domainePrestation: user.domainePrestation || "",
        dureeJournaliere: user.dureeJournaliere || 0,
        nombreJour: user.nombreJour || 0,
        horaire: user.horaire || "",
      });
    }
    setEditSection(section);
  };

  const handleSaveSection = () => {
    if (editSection === "personal") updateInfoMutation.mutate(personalForm);
    if (editSection === "professional")
      updateFullMutation.mutate(professionalForm);
    if (editSection === "stagiaire") updateFullMutation.mutate(stagiaireForm);
    if (editSection === "prestataire")
      updateFullMutation.mutate(prestataireForm);
  };

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("Mots de passe différents", false);
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("Min 6 caractères", false);
      return;
    }
    changePasswordMutation.mutate();
  };

  const getInitials = () =>
    `${user?.prenoms?.[0] || ""}${user?.nom?.[0] || ""}`.toUpperCase();

  const getRoleBadge = () => {
    const map: Record<string, { label: string; color: string }> = {
      admin: {
        label: "Administrateur",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
      manager: {
        label: "Manager",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
      collaborateur: {
        label: "Collaborateur",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
      client: {
        label: "Client",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
    };
    return map[user?.role ?? ""] ?? { label: "", color: "" };
  };

  const getProfileBadge = () => {
    if (!user?.profile) return null;
    const map: Record<string, { label: string; color: string }> = {
      stagiaire: {
        label: "Stagiaire",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
      prestataire: {
        label: "Prestataire",
        color: "bg-[#6C4EA8]/20 text-purple-400 border-[#6C4EA8]/30",
      },
    };
    return map[user.profile] ?? null;
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const isPro = user?.role === "collaborateur" || user?.role === "manager";

  const isPhotoLoading =
    uploadPhotoMutation.isPending || deletePhotoMutation.isPending;

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6C4EA8]/30 border-t-[#6C4EA8]" />
      </div>
    );
  }

  const roleBadge = getRoleBadge();
  const profileBadge = getProfileBadge();

  // --- Edit modal content per section ---
  const editFields: Record<string, React.ReactNode> = {
    personal: (
      <div className="space-y-3">
        <FormRow label="Nom">
          <Input
            value={personalForm.nom}
            onChange={(v) => setPersonalForm((f) => ({ ...f, nom: v }))}
          />
        </FormRow>
        <FormRow label="Prénoms">
          <Input
            value={personalForm.prenoms}
            onChange={(v) => setPersonalForm((f) => ({ ...f, prenoms: v }))}
          />
        </FormRow>
        <FormRow label="Email">
          <Input
            value={personalForm.email}
            onChange={(v) => setPersonalForm((f) => ({ ...f, email: v }))}
            type="email"
          />
        </FormRow>
        <FormRow label="Téléphone">
          <Input
            value={personalForm.telephone}
            onChange={(v) => setPersonalForm((f) => ({ ...f, telephone: v }))}
          />
        </FormRow>
        {isPro && (
          <>
            <FormRow label="Date de naissance">
              <Input
                value={personalForm.dateNaissance}
                onChange={(v) =>
                  setPersonalForm((f) => ({ ...f, dateNaissance: v }))
                }
                type="date"
              />
            </FormRow>
            <FormRow label="Genre">
              <select
                value={personalForm.genre}
                onChange={(e) =>
                  setPersonalForm((f) => ({ ...f, genre: e.target.value }))
                }
                className="w-full bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
              >
                <option value="">Sélectionner</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </FormRow>
            <FormRow label="Adresse">
              <Input
                value={personalForm.adresse}
                onChange={(v) => setPersonalForm((f) => ({ ...f, adresse: v }))}
              />
            </FormRow>
            <FormRow label="CIN">
              <Input
                value={personalForm.cin}
                onChange={(v) => setPersonalForm((f) => ({ ...f, cin: v }))}
              />
            </FormRow>
          </>
        )}
      </div>
    ),
    professional: (
      <div className="space-y-3">
        <FormRow label="Poste">
          <Input
            value={professionalForm.poste}
            onChange={(v) => setProfessionalForm((f) => ({ ...f, poste: v }))}
          />
        </FormRow>
        <FormRow label="Date de début">
          <Input
            value={professionalForm.dateDebut}
            onChange={(v) =>
              setProfessionalForm((f) => ({ ...f, dateDebut: v }))
            }
            type="date"
          />
        </FormRow>
        <FormRow label="Durée indéterminée">
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={professionalForm.dateFinIndeterminee}
              onChange={(e) =>
                setProfessionalForm((f) => ({
                  ...f,
                  dateFinIndeterminee: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-[#6C4EA8]"
            />
            <span className="text-sm text-gray-300">Oui</span>
          </div>
        </FormRow>
        {!professionalForm.dateFinIndeterminee && (
          <FormRow label="Date de fin">
            <Input
              value={professionalForm.dateFin}
              onChange={(v) =>
                setProfessionalForm((f) => ({ ...f, dateFin: v }))
              }
              type="date"
            />
          </FormRow>
        )}
        <FormRow label="TJM (Ar)">
          <Input
            value={String(professionalForm.tjm)}
            onChange={(v) =>
              setProfessionalForm((f) => ({ ...f, tjm: Number(v) }))
            }
            type="number"
          />
        </FormRow>
      </div>
    ),
    stagiaire: (
      <div className="space-y-3">
        <FormRow label="Mission">
          <Input
            value={stagiaireForm.mission}
            onChange={(v) => setStagiaireForm((f) => ({ ...f, mission: v }))}
          />
        </FormRow>
        <FormRow label="Indemnité (Ar)">
          <Input
            value={String(stagiaireForm.indemnite)}
            onChange={(v) =>
              setStagiaireForm((f) => ({ ...f, indemnite: Number(v) }))
            }
            type="number"
          />
        </FormRow>
        <FormRow label="Indemnité connexion (Ar)">
          <Input
            value={String(stagiaireForm.indemniteConnexion)}
            onChange={(v) =>
              setStagiaireForm((f) => ({ ...f, indemniteConnexion: Number(v) }))
            }
            type="number"
          />
        </FormRow>
      </div>
    ),
    prestataire: (
      <div className="space-y-3">
        <FormRow label="Domaine de prestation">
          <Input
            value={prestataireForm.domainePrestation}
            onChange={(v) =>
              setPrestataireForm((f) => ({ ...f, domainePrestation: v }))
            }
          />
        </FormRow>
        <FormRow label="Durée journalière (h)">
          <Input
            value={String(prestataireForm.dureeJournaliere)}
            onChange={(v) =>
              setPrestataireForm((f) => ({ ...f, dureeJournaliere: Number(v) }))
            }
            type="number"
          />
        </FormRow>
        <FormRow label="Nombre de jours">
          <Input
            value={String(prestataireForm.nombreJour)}
            onChange={(v) =>
              setPrestataireForm((f) => ({ ...f, nombreJour: Number(v) }))
            }
            type="number"
          />
        </FormRow>
        <FormRow label="Horaire">
          <select
            value={prestataireForm.horaire}
            onChange={(e) =>
              setPrestataireForm((f) => ({ ...f, horaire: e.target.value }))
            }
            className="w-full bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
          >
            <option value="">Sélectionner</option>
            <option value="temps plein">Temps plein</option>
            <option value="temps partiel">Temps partiel</option>
          </select>
        </FormRow>
      </div>
    ),
  };

  const sectionTitles: Record<string, string> = {
    personal: "Modifier les informations personnelles",
    professional: "Modifier les informations professionnelles",
    stagiaire: "Modifier les informations de stage",
    prestataire: "Modifier les informations de prestation",
  };

  return (
    <div className=" mx-auto space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${
            toast.ok
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Photo viewer */}
      {showPhotoViewer && user.profilePhoto?.url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhotoViewer(false)}
        >
          <div className="relative max-w-lg w-full">
            <button
              className="absolute -top-10 right-0 text-white/60 hover:text-white"
              onClick={() => setShowPhotoViewer(false)}
            >
              <X size={24} />
            </button>
            <img
              src={user.profilePhoto.url}
              alt="Photo"
              className="w-full rounded-xl object-cover shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Signature viewer */}
      {showSignatureViewer && user.signature?.url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSignatureViewer(false)}
        >
          <div className="relative max-w-lg w-full bg-white/5 rounded-xl p-6">
            <button
              className="absolute -top-10 right-0 text-white/60 hover:text-white"
              onClick={() => setShowSignatureViewer(false)}
            >
              <X size={24} />
            </button>
            <img
              src={user.signature.url}
              alt="Signature"
              className="w-full object-contain max-h-48"
            />
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {showDeletePhotoConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1d] border border-[#313442] rounded-xl w-full max-w-sm shadow-2xl">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Supprimer la photo
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Êtes-vous sûr de vouloir supprimer votre photo de profil ? 
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setShowDeletePhotoConfirm(false)}
                disabled={deletePhotoMutation.isPending}
                className="flex-1 px-3 py-2 text-xs text-gray-400 border border-[#313442] rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => deletePhotoMutation.mutate()}
                disabled={deletePhotoMutation.isPending}
                className="flex-1 px-3 py-2 text-xs bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deletePhotoMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1d] border border-[#313442] rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#313442] flex-shrink-0">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 size={15} className="text-[#6C4EA8]" />
                {sectionTitles[editSection]}
              </h3>
              <button
                onClick={() => setEditSection(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {editFields[editSection]}
            </div>
            <div className="flex gap-2 p-4 border-t border-[#313442] flex-shrink-0">
              <button
                onClick={() => setEditSection(null)}
                className="flex-1 px-3 py-2 text-xs text-gray-400 border border-[#313442] rounded-lg hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSection}
                disabled={
                  updateInfoMutation.isPending || updateFullMutation.isPending
                }
                className="flex-1 px-3 py-2 text-xs bg-[#6C4EA8] hover:bg-[#5a3d8a] text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save size={12} />
                {updateInfoMutation.isPending || updateFullMutation.isPending
                  ? "Sauvegarde..."
                  : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="h-30 -mt-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-stretch gap-4 h-full">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-34 h-34 rounded-xl overflow-hidden border-4 border-[#1a1a1d] shadow-xl relative ${user.profilePhoto?.url && !isPhotoLoading ? "cursor-pointer" : ""}`}
              onClick={() =>
                user.profilePhoto?.url &&
                !isPhotoLoading &&
                setShowPhotoViewer(true)
              }
            >
              {/* Loading overlay */}
              {isPhotoLoading && (
                <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-1.5 rounded-xl">
                  <Loader2 size={22} className="text-white animate-spin" />
                  <span className="text-[10px] text-white/80 font-medium">
                    {uploadPhotoMutation.isPending ? "Upload..." : "Suppression..."}
                  </span>
                </div>
              )}

              {user.profilePhoto?.url ? (
                <img
                  src={user.profilePhoto.url}
                  alt="Avatar"
                  className={`w-full h-full object-cover transition-opacity duration-200 ${isPhotoLoading ? "opacity-40" : "opacity-100"}`}
                />
              ) : (
                <div
                  className={`w-full h-full bg-[#6C4EA8] flex items-center justify-center text-white text-2xl font-bold transition-opacity duration-200 ${isPhotoLoading ? "opacity-40" : "opacity-100"}`}
                >
                  {getInitials()}
                </div>
              )}
            </div>

            <div className="absolute -bottom-6 -right-2 flex gap-1">
              <button
                onClick={() => !isPhotoLoading && fileInputRef.current?.click()}
                disabled={isPhotoLoading}
                className="w-7 h-7 bg-[#6C4EA8] hover:bg-[#5a3d8a] rounded-lg flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Modifier la photo"
              >
                {uploadPhotoMutation.isPending ? (
                  <Loader2 size={12} className="text-white animate-spin" />
                ) : (
                  <Edit2 size={12} className="text-white" />
                )}
              </button>
              {user.profilePhoto?.url && (
                <button
                  onClick={() =>
                    !isPhotoLoading && setShowDeletePhotoConfirm(true)
                  }
                  disabled={isPhotoLoading}
                  className="w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Supprimer la photo"
                >
                  {deletePhotoMutation.isPending ? (
                    <Loader2 size={12} className="text-white animate-spin" />
                  ) : (
                    <Trash2 size={12} className="text-white" />
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name & badges - centré verticalement */}
          <div className="flex-1 min-w-0 flex items-center h-full">
            <div className="mb-1">
              <h1 className="text-xl font-bold text-white truncate">
                {user.prenoms} {user.nom}
              </h1>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
                {profileBadge && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${profileBadge.color}`}
                  >
                    {profileBadge.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
        {/* Infos personnelles */}
        <InfoCard
          title="Informations personnelles"
          icon=""
          onEdit={() => openEdit("personal")}
        >
          <InfoRow icon={<Mail size={13} />} label="Email" value={user.email} />
          <InfoRow
            icon={<Phone size={13} />}
            label="Téléphone"
            value={user.telephone}
          />
          {isPro && (
            <>
              <InfoRow
                icon={<Calendar size={13} />}
                label="Date de naissance"
                value={formatDate(user.dateNaissance)}
              />
              <InfoRow
                icon={<User size={13} />}
                label="Genre"
                value={user.genre}
              />
              <InfoRow
                icon={<MapPin size={13} />}
                label="Adresse"
                value={user.adresse}
              />
              <InfoRow
                icon={<CreditCard size={13} />}
                label="CIN"
                value={user.cin}
              />
            </>
          )}
        </InfoCard>

        {/* Infos professionnelles */}
        {isPro && (
          <InfoCard
            title="Informations professionnelles"
            icon={<Briefcase size={15} className="text-[#6C4EA8]" />}
            onEdit={() => openEdit("professional")}
          >
            <InfoRow
              icon={<Briefcase size={13} />}
              label="Poste"
              value={user.poste}
            />
            <InfoRow
              icon={<Calendar size={13} />}
              label="Date de début"
              value={formatDate(user.dateDebut)}
            />
            {user.dateFinIndeterminee ? (
              <InfoRow
                icon={<Clock size={13} />}
                label="Durée"
                value="Indéterminée"
              />
            ) : (
              <InfoRow
                icon={<Calendar size={13} />}
                label="Date de fin"
                value={formatDate(user.dateFin)}
              />
            )}
            <InfoRow
              icon={<Banknote size={13} />}
              label="TJM"
              value={user.tjm !== undefined ? `${user.tjm} Ar` : undefined}
            />
          </InfoCard>
        )}

        {/* Stagiaire */}
        {user.profile === "stagiaire" && (
          <InfoCard
            title="Informations stage"
            icon={<FileText size={15} className="text-green-400" />}
            onEdit={() => openEdit("stagiaire")}
          >
            <InfoRow
              icon={<Briefcase size={13} />}
              label="Mission"
              value={user.mission}
            />
            <InfoRow
              icon={<Banknote size={13} />}
              label="Indemnité"
              value={
                user.indemnite !== undefined
                  ? `${user.indemnite} Ar`
                  : undefined
              }
            />
            <InfoRow
              icon={<Wifi size={13} />}
              label="Indemnité connexion"
              value={
                user.indemniteConnexion !== undefined
                  ? `${user.indemniteConnexion} Ar`
                  : undefined
              }
            />
          </InfoCard>
        )}

        {/* Prestataire */}
        {user.profile === "prestataire" && (
          <InfoCard
            title="Informations prestation"
            icon={<FileText size={15} className="text-orange-400" />}
            onEdit={() => openEdit("prestataire")}
          >
            <InfoRow
              icon={<Briefcase size={13} />}
              label="Domaine"
              value={user.domainePrestation}
            />
            <InfoRow
              icon={<Clock size={13} />}
              label="Durée journalière"
              value={
                user.dureeJournaliere !== undefined
                  ? `${user.dureeJournaliere}h`
                  : undefined
              }
            />
            <InfoRow
              icon={<Calendar size={13} />}
              label="Nombre de jours"
              value={
                user.nombreJour !== undefined
                  ? `${user.nombreJour} j`
                  : undefined
              }
            />
            <InfoRow
              icon={<Clock size={13} />}
              label="Horaire"
              value={user.horaire}
            />
          </InfoCard>
        )}

        {/* Admin */}
        {user.role === "admin" && (
          <InfoCard
            title="Accès administrateur"
            icon={<Shield size={15} className="text-red-400" />}
          >
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <Shield size={14} className="text-red-400" />
              <span className="text-xs text-red-300">
                Accès complet à la plateforme
              </span>
            </div>
          </InfoCard>
        )}

        {/* Signature */}
        {isPro && (
          <InfoCard
            title="Signature"
            icon={<PenLine size={15} className="text-[#6C4EA8]" />}
          >
            {user.signature?.url ? (
              <div className="space-y-3">
                <div
                  className="bg-[#0F0F12] rounded-lg p-3 border border-[#313442] cursor-pointer hover:border-[#6C4EA8]/50 transition-colors"
                  onClick={() => setShowSignatureViewer(true)}
                >
                  <img
                    src={user.signature.url}
                    alt="Signature"
                    className="h-16 object-contain w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignatureViewer(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 bg-transparent focus:ring-white/20 border border-gray-400/40 rounded-lg transition-colors"
                  >
                    <Eye size={12} /> Voir
                  </button>
                  <button
                    onClick={() => signatureInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500 transition-colors rounded-lg"
                  >
                    <Edit2 size={12} /> Modifier
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <PenLine size={28} className="text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">
                  Aucune signature enregistrée
                </p>
                <button
                  onClick={() => signatureInputRef.current?.click()}
                  className="px-4 py-2 text-xs bg-[#6C4EA8]/20 hover:bg-[#6C4EA8]/30 border border-[#6C4EA8]/30 text-purple-400 rounded-lg transition-colors"
                >
                  Ajouter une signature
                </button>
              </div>
            )}
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureChange}
            />
            {uploadSignatureMutation.isPending && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-[#6C4EA8]/30 border-t-[#6C4EA8] rounded-full" />
                Upload en cours...
              </p>
            )}
          </InfoCard>
        )}
      </div>

      {/* Mot de passe */}
      <div className="bg-[#1a1a1d] border border-[#313442] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lock size={15} className="text-[#6C4EA8]" />
            Sécurité — Mot de passe
          </h2>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <Edit2 size={12} /> Modifier
            </button>
          )}
        </div>

        {!changingPassword ? (
          <div className="flex items-center gap-3 p-3 bg-[#0F0F12] rounded-lg border border-[#313442]">
            <Lock size={14} className="text-gray-500" />
            <span className="text-sm text-gray-500 tracking-widest">
              ••••••••••••
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {(
              [
                { label: "Mot de passe actuel", key: "currentPassword" },
                { label: "Nouveau mot de passe", key: "newPassword" },
                { label: "Confirmer", key: "confirmPassword" },
              ] as { label: string; key: keyof typeof passwordForm }[]
            ).map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1 block">
                  {label}
                </label>
                <input
                  type="password"
                  value={passwordForm[key]}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, [key]: e.target.value })
                  }
                  className="w-full bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex-1 px-3 py-2 text-xs text-gray-400 border border-[#313442] rounded-lg hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePassword}
                disabled={changePasswordMutation.isPending}
                className="flex-1 px-3 py-2 text-xs bg-[#6C4EA8] hover:bg-[#5a3d8a] text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save size={12} />
                {changePasswordMutation.isPending
                  ? "Modification..."
                  : "Changer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="bg-[#1a1a1d] border border-[#313442] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          {title}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <Edit2 size={12} /> Modifier
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-gray-200 truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
    />
  );
}