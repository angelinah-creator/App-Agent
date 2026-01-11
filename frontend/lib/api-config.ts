// frontend/lib/api-config.ts
import axios from "axios"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Configuration des intercepteurs
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};
    
    switch (status) {
      case 401:
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "/login";
        break;
      case 403:
        alert("Vous n'avez pas la permission d'effectuer cette action");
        break;
      case 404:
        console.error("Ressource non trouvée:", error.config?.url);
        break;
      case 409:
        alert(data?.message || "Conflit: Cette ressource existe déjà");
        break;
      case 500:
        alert("Erreur serveur. Veuillez réessayer plus tard.");
        break;
      default:
        console.error("Erreur API:", error);
    }
    
    return Promise.reject(error);
  },
);
