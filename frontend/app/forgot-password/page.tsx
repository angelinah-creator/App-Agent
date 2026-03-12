"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";
import { passwordResetService } from "@/lib/password-reset-service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await passwordResetService.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-[#110521] px-4">
        <div className="relative z-10 w-full max-w-md bg-black rounded-xl py-8 px-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image src="/images/logo2.png" width={80} height={80} alt="Logo" />
          </div>

          <h1 className="text-center text-2xl font-bold text-white">
            OPSIDE - CODE TALENT
          </h1>

          <div className="mt-8 text-center">
            <div className="mx-auto w-16 h-16 bg-purple-500/20 border border-purple-500/40 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Email envoyé !
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              Si un compte existe avec l'adresse{" "}
              <span className="text-purple-400 font-medium">{email}</span>,
              vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[#8254ff] hover:bg-[#6d46d9] text-white py-2 rounded-sm font-medium transition"
              >
                Retour à la connexion
              </button>

              <button
                onClick={() => {
                  setEmail("");
                  setIsSubmitted(false);
                }}
                className="w-full bg-[#141414] border border-[#333] text-gray-300 hover:bg-[#1b1b1b] py-2 rounded-sm font-medium transition text-sm"
              >
                Demander un nouveau lien
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#110521] px-4">
      <div className="relative z-10 w-full max-w-md bg-black rounded-xl py-8 px-8">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/logo2.png" width={80} height={80} alt="Logo" />
        </div>

        {/* Titre */}
        <h1 className="text-center text-2xl font-bold text-white">
          OPSIDE - CODE TALENT
        </h1>
        <p className="text-center text-gray-500 text-sm mt-1 mb-6">
          Réinitialisation de mot de passe
        </p>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 rounded-sm bg-red-500/20 border border-red-600 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs text-gray-300">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#161616] text-white placeholder-gray-500 border border-[#333] rounded-sm pl-10 pr-3 py-2 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8254ff] hover:bg-[#6d46d9] text-white py-2 rounded-sm font-medium transition disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              "Envoyer le lien de réinitialisation"
            )}
          </button>

          {/* Retour connexion */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" />
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}