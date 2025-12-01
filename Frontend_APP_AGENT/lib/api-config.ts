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
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
