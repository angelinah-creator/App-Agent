"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { QueryClient } from "@tanstack/react-query"

// Créer le QueryClient pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem("authToken")

    if (!token) {
      // Pas de token, rediriger vers login
      router.push("/login")
    } else {
      // Token présent, rediriger vers home
      router.push("/home")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Redirection...</p>
      </div>
    </div>
  )
}
