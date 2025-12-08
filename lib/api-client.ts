// Simple API client for making requests to the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export const apiClient = {
  async get(endpoint: string) {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw { response: { data: error } }
    }

    return response.json()
  },

  async put(endpoint: string, data: any) {
    const token = localStorage.getItem("authToken")
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw { response: { data: error } }
    }

    return response.json()
  },
}
