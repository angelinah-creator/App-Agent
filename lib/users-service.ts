const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export enum Genre {
  Homme = "Homme",
  Femme = "Femme",
}

export enum UserProfile {
  stagiaire = "stagiaire",
  prestataire = "prestataire",
  admin = "admin",
}

export interface Agent {
  _id: string;
  profile: UserProfile;
  nom: string;
  prenoms: string;
  dateNaissance: string;
  genre: Genre;
  adresse: string;
  cin: string;
  poste: string;
  dateDebut: string;
  dateFin?: string;
  dateFinIndeterminee: boolean;
  tjm: number;
  telephone: string;
  email: string;
  mission?: string;
  indemnite?: number;
  indemniteConnexion?: number;
  domainePrestation?: string;
  tarifJournalier?: number;
  dureeJournaliere?: number;
}

export interface CreateAgentDto {
  profile: UserProfile;
  nom: string;
  prenoms: string;
  dateNaissance: string;
  genre: Genre;
  adresse: string;
  cin: string;
  poste: string;
  dateDebut: string;
  dateFin?: string;
  dateFinIndeterminee: boolean;
  tjm: number;
  telephone: string;
  email: string;
  password: string;
  mission?: string;
  indemnite?: number;
  indemniteConnexion?: number;
  domainePrestation?: string;
  tarifJournalier?: number;
  dureeJournaliere?: number;
}

export interface UserStats {
  totalAgents: number;
  stagiaires: number;
  prestataires: number;
  activeContracts: number;
}

export interface ChangeProfileDto {
  profile: UserProfile;
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const usersService = {
  async changeUserProfile(
    agentId: string,
    newProfile: UserProfile
  ): Promise<Agent> {
    console.log("=== CHANGEMENT DE PROFIL ===");
    console.log("Agent ID:", agentId);
    console.log("Nouveau profil:", newProfile);

    const response = await fetch(
      `${API_BASE_URL}/users/${agentId}/change-profile`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ profile: newProfile }),
      }
    );

    console.log("Statut:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Erreur:", errorText);

        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorText;
        }
      } catch (e) {
        console.log("Impossible de parser l'erreur:", e);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("SUCCeˆS:", result);
    return result;
  },

  async getAllAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des agents");
    }

    return response.json();
  },

  async createAgent(data: CreateAgentDto): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création de l'agent");
    }

    return response.json();
  },

  async updateAgent(agentId: string, updateData: any): Promise<Agent> {
    console.log("=== DÉBUT UPDATE AGENT ===");
    console.log("URL:", `${API_BASE_URL}/users/${agentId}`);
    console.log("Données:", updateData);

    const response = await fetch(`${API_BASE_URL}/users/${agentId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    console.log("Statut:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Corps de l'erreur:", errorText);

        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorText;
        }
      } catch (e) {
        console.log("Impossible de parser l'erreur:", e);
      }

      console.log("=== FIN UPDATE AGENT - ERREUR ===");
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Réponse réussie:", result);
    console.log("=== FIN UPDATE AGENT - SUCCÈS ===");
    return result;
  },

  async deleteAgent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de l'agent");
    }
  },

  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des statistiques");
    }

    return response.json();
  },
};
