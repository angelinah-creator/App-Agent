// frontend/lib/auth-service.ts
import axios from "axios"
import { firebaseAuth } from "./firebase-auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // CORRECTION: Ne rediriger que si on a un token ET qu'il est invalide
    // Ne PAS rediriger lors d'une tentative de connexion échouée
    const isLoginAttempt = error.config?.url?.includes('/auth/signin') || 
                           error.config?.url?.includes('/auth/google') ||
                           error.config?.url?.includes('/auth/admin/signin');
    
    if (error.response?.status === 401 && !isLoginAttempt) {
      // Token expiré ou invalide - rediriger uniquement si on était déjà connecté
      const hadToken = localStorage.getItem("authToken");
      if (hadToken) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  profile: "stagiaire" | "prestataire"
  nom: string
  prenoms: string
  dateNaissance: string
  genre: "Homme" | "Femme"
  adresse: string
  cin: string
  poste: string
  dateDebut: string
  dateFin?: string
  dateFinIndeterminee: boolean
  tjm: number
  telephone: string
  email: string
  password: string
  mission?: string
  indemnite?: number
  indemniteConnexion?: number
  domainePrestation?: string
  tarifJournalier?: number
  dureeJournaliere?: number
}

export interface GoogleLoginResponse {
  user: any
  token: string
  firebaseUser?: {
    uid: string
    email: string | null
    displayName: string | null
    photoURL: string | null
  }
}

export const authService = {
  async login(loginData: LoginData) {
    const response = await api.post("/auth/signin", loginData)
    return response.data
  },

  async loginAdmin(loginData: LoginData) {
    const response = await api.post("/auth/admin/signin", loginData)
    return response.data
  },

  async register(registerData: RegisterData) {
    const response = await api.post("/auth/signup", registerData)
    return response.data
  },

  async loginWithGoogle(): Promise<GoogleLoginResponse> {
    try {
      // 1. Connexion Firebase
      const firebaseResult = await firebaseAuth.signInWithGoogle()

      // 2. Envoyer SEULEMENT le token au backend
      const response = await api.post("/auth/google", {
        idToken: firebaseResult.idToken,
        // NE PAS envoyer email et displayName
      })

      // 3. Stocker le token du backend
      const backendToken = response.data.token
      localStorage.setItem("authToken", backendToken)
      localStorage.setItem("userData", JSON.stringify(response.data.user))

      return {
        ...response.data,
        firebaseUser: firebaseResult.user,
      }
    } catch (error: any) {
      // En cas d'erreur, déconnecter de Firebase
      await firebaseAuth.signOut()

      // Afficher un message d'erreur spécifique
      if (error.response?.status === 404) {
        throw new Error("Aucun compte trouvé. Veuillez d'abord créer un compte avec cet email.")
      }

      throw error
    }
  },

  async getProfile() {
    const response = await api.get("/auth/me")
    return response.data
  },

  async logout() {
    // Déconnexion Firebase
    await firebaseAuth.signOut()

    // Nettoyage local
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
  },

  // Écouter les changements d'authentification Firebase
  onAuthStateChanged(callback: (user: any) => void) {
    return firebaseAuth.onAuthStateChanged(callback)
  },
}