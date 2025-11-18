"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
    general: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ email: "", password: "", general: "" }); // Reset errors

    try {
      const response = await authService.login(formData);

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la connexion";
      
      if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("mot de passe")) {
        setErrors({
          general: "Email ou mot de passe incorrect",
          email: " ",
          password: " " // Espace pour maintenir l'espacement
        });
      } else {
        setErrors({
          ...errors,
          general: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({ email: "", password: "", general: "" }); // Reset errors
    
    try {
      const response = await authService.loginWithGoogle();

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      router.push("/home");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de la connexion avec Google";

      // Si c'est une erreur "utilisateur non trouvé", proposer de créer un compte
      if (error.response?.status === 404) {
        if (
          confirm(
            "Aucun compte trouvé avec cet email. Voulez-vous créer un compte ?"
          )
        ) {
          router.push("/signup");
        }
      } else {
        setErrors({
          ...errors,
          general: errorMessage
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Fonction pour effacer les erreurs quand l'utilisateur modifie un champ
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof typeof errors] || errors.general) {
      setErrors({ email: "", password: "", general: "" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* ... (le reste du code JSX pour le background reste identique) ... */}

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-balance bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg">
            Agent App
          </h1>
          <p className="text-gray-700 text-lg">Connectez-vous à votre espace</p>
        </div>

        <Card className="border-violet-200 shadow-2xl backdrop-blur-xl bg-white hover:bg-gray-50 transition-all duration-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Connexion
            </CardTitle>
            <CardDescription className="text-gray-600">
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Message d'erreur général */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.general}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className={`transition-all duration-300 focus:scale-[1.02] ${
                    errors.email || errors.general ? "border-red-300 focus:border-red-400" : "border-violet-200 focus:border-violet-400"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className={`transition-all duration-300 focus:scale-[1.02] ${
                      errors.password || errors.general ? "border-red-300 focus:border-red-400" : "border-violet-200 focus:border-violet-400"
                    } pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg hover:shadow-xl hover:shadow-violet-500/50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-600">ou</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full transition-all duration-300 hover:scale-[1.02] bg-white border-2 border-violet-200 hover:border-violet-400 text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  <>
                    {/* Google Icon SVG */}
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Se connecter avec Google
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <div className="text-center text-sm text-gray-600">
                Pas encore de compte ?{" "}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                >
                  Créer un compte
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}