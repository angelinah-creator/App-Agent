"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Key, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { passwordResetService } from "@/lib/password-reset-service";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }
      try {
        const { isValid } = await passwordResetService.validateResetToken(token);
        setIsTokenValid(isValid);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Lien de réinitialisation invalide");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await passwordResetService.resetPassword(token, formData.password);
      setSuccess("Mot de passe réinitialisé avec succès !");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // État : validation en cours
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#110521]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8254ff]/30 border-t-[#8254ff] mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Validation du lien...</p>
        </div>
      </div>
    );
  }

  // État : token invalide
  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#110521] px-4">
        <div className="w-full max-w-md bg-black rounded-xl py-8 px-8">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo2.png" width={80} height={80} alt="Logo" />
          </div>
          <h1 className="text-center text-2xl font-bold text-white">
            OPSIDE - CODE TALENT
          </h1>

          <div className="flex flex-col items-center mt-8 mb-6">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Lien invalide ou expiré</h2>
            <p className="text-center text-gray-400 text-sm">
              Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
            </p>
          </div>

          <button
            onClick={() => router.push("/forgot-password")}
            className="w-full bg-[#8254ff] hover:bg-[#6d46d9] text-white py-2 rounded-sm font-medium transition"
          >
            Demander un nouveau lien
          </button>
        </div>
      </div>
    );
  }

  // État : formulaire principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110521] px-4">
      <div className="w-full max-w-md bg-black rounded-xl py-8 px-8">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/logo2.png" width={80} height={80} alt="Logo" />
        </div>

        <h1 className="text-center text-2xl font-bold text-white">
          OPSIDE - CODE TALENT
        </h1>
        <p className="text-center text-gray-500 text-sm mt-1 mb-6">
          Créer un nouveau mot de passe
        </p>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 rounded-sm bg-red-500/20 border border-red-600 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Succès */}
        {success && (
          <div className="mb-4 p-3 rounded-sm bg-[#8254ff]/20 border border-[#8254ff]/40 text-purple-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <label className="text-xs text-gray-300">Nouveau mot de passe</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full bg-[#161616] text-white placeholder-gray-500 border border-[#333] rounded-sm px-3 py-2 pl-9 pr-10 outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmer mot de passe */}
          <div className="space-y-2">
            <label className="text-xs text-gray-300">Confirmer le mot de passe</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full bg-[#161616] text-white placeholder-gray-500 border border-[#333] rounded-sm px-3 py-2 pl-9 pr-10 outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Bouton soumettre */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8254ff] hover:bg-[#6d46d9] text-white py-2 rounded-sm font-medium transition disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Réinitialisation...
              </span>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110521]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8254ff]/30 border-t-[#8254ff] mx-auto" />
        <p className="mt-4 text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}