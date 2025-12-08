// frontend/hooks/use-auth.ts
import { useState, useEffect } from 'react'
import { authService } from '@/lib/auth-service'

export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const checkAuth = () => {
      const userData = localStorage.getItem('userData')
      if (userData) {
        setUser(JSON.parse(userData))
      }
      setLoading(false)
    }

    checkAuth()

    // Écouter les changements d'authentification Firebase
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        // Si déconnecté de Firebase mais toujours connecté au backend
        const backendUser = localStorage.getItem('userData')
        if (!backendUser) {
          setUser(null)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}