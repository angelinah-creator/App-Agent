"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { authService } from "@/lib/auth-service";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ email: "", password: "", general: "" });

    try {
      const response = await authService.login(formData);

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la connexion";

      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("mot de passe")
      ) {
        setErrors({
          general: "Email ou mot de passe incorrect",
          email: " ",
          password: " ",
        });
      } else {
        setErrors({
          ...errors,
          general: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({ email: "", password: "", general: "" });

    try {
      const response = await authService.loginWithGoogle();

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de la connexion avec Google";

      if (error.response?.status === 404) {
        if (confirm("Aucun compte trouvé. Voulez-vous créer un compte ?")) {
          router.push("/signup");
        }
      } else {
        setErrors({
          ...errors,
          general: message,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    if (errors[field as keyof typeof errors] || errors.general) {
      setErrors({ email: "", password: "", general: "" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#110521] px-4">
      <div className="relative z-10 w-full max-w-xl bg-black rounded-xl py-15 px-12">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/images/logo2.png" width={110} height={110} alt="Logo" />
        </div>

        {/* Titre */}
        <h1 className="text-center text-3xl font-bold text-white">
          OPSIDE - CODE TALENT
        </h1>
        <p className="text-center text-gray-500 text-sm mt-2 mb-8">
          Connectez-vous à votre espace
        </p>

        {/* Erreur générale */}
        {errors.general && (
          <div className="mb-4 p-3 rounded-sm bg-red-500/20 border border-red-600 text-red-300 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              className={`w-full bg-[#161616] text-white placeholder-gray-500 border rounded-sm px-4 py-3 outline-none ${
                errors.email ? "border-red-500" : "border-[#333]"
              } focus:border-purple-500`}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                className={`w-full bg-[#161616] text-white placeholder-gray-500 border rounded-sm px-4 py-3 pr-12 outline-none ${
                  errors.password ? "border-red-500" : "border-[#333]"
                } focus:border-purple-500`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Bouton Connexion */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8254ff] hover:bg-[#6d46d9] text-white py-3 rounded-sm font-medium transition disabled:opacity-50"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>

          {/* Mot de passe oublié */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="flex justify-center">
            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="flex items-center justify-center gap-2 bg-[#141414] border border-[#333] text-white py-3 text-sm rounded-sm hover:bg-[#1b1b1b] transition disabled:opacity-50 p-4"
            >
              {isGoogleLoading ? (
                "Connexion..."
              ) : (
                <>
                  <Image
                    src="/images/google.png"
                    width={18}
                    height={18}
                    alt=""
                  />
                  Se connecter avec Google
                </>
              )}
            </button>
          </div>

          {/* Créer un compte */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="text-purple-400 hover:text-purple-300"
            >
              Créer un compte opside
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
