"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Save, X, Eye, EyeOff, Lock } from "lucide-react"
import type { Agent } from "@/lib/users-service"

interface ProfilSectionProps {
  userData: Agent
  onLogout: () => void
  onUpdateProfile: (data: Partial<Agent>) => Promise<void>
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

// Fonction utilitaire pour afficher une notification (à utiliser si vous n'avez pas de contexte)
const showLocalNotification = (title: string, message: string, type: "error" | "success" | "warning" | "info" = "error") => {
  // Pour l'instant, on utilise alert en fallback
  // Vous pourrez remplacer par votre modal plus tard
  alert(`${title}: ${message}`);
}

export function ProfilSection({ 
  userData, 
  onLogout, 
  onUpdateProfile,
  onUpdatePassword 
}: ProfilSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nom: userData.nom,
    prenoms: userData.prenoms,
    email: userData.email,
    telephone: userData.telephone,
    adresse: userData.adresse,
    cin: userData.cin,
    poste: userData.poste,
    dateNaissance: userData.dateNaissance?.split('T')[0] || '',
    genre: userData.genre,
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onUpdateProfile(formData)
      setIsEditing(false)
      // Le message de succès est géré par la mutation dans page.tsx
    } catch (error: any) {
      showLocalNotification(
        "Erreur de mise à jour",
        error.message || "Erreur lors de la mise à jour du profil",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nom: userData.nom,
      prenoms: userData.prenoms,
      email: userData.email,
      telephone: userData.telephone,
      adresse: userData.adresse,
      cin: userData.cin,
      poste: userData.poste,
      dateNaissance: userData.dateNaissance?.split('T')[0] || '',
      genre: userData.genre,
    })
    setIsEditing(false)
  }

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showLocalNotification(
        "Erreur de validation",
        "Les mots de passe ne correspondent pas",
        "error"
      )
      return
    }

    if (passwordData.newPassword.length < 6) {
      showLocalNotification(
        "Erreur de validation",
        "Le mot de passe doit contenir au moins 6 caractères",
        "error"
      )
      return
    }

    setIsLoading(true)
    try {
      await onUpdatePassword(passwordData.currentPassword, passwordData.newPassword)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
      // Le message de succès est géré par la mutation dans page.tsx
    } catch (error: any) {
      showLocalNotification(
        "Erreur de changement de mot de passe",
        error.message || "Erreur lors du changement de mot de passe",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (label: string, name: keyof typeof formData, type = "text") => (
    <div>
      <Label className="text-sm text-slate-600">{label}</Label>
      {isEditing ? (
        <Input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className="mt-1"
        />
      ) : (
        <p className="font-medium text-slate-800 mt-1">
          {formData[name] || "-"}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Informations personnelles */}
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-slate-800">Informations personnelles</h3>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField("Nom", "nom")}
            {renderField("Prénom(s)", "prenoms")}
            {renderField("Email", "email", "email")}
            {renderField("Téléphone", "telephone", "tel")}
            {renderField("CIN", "cin")}
            
            <div>
              <Label className="text-sm text-slate-600">Genre</Label>
              {isEditing ? (
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              ) : (
                <p className="font-medium text-slate-800 mt-1">{formData.genre}</p>
              )}
            </div>

            {renderField("Date de naissance", "dateNaissance", "date")}
            {renderField("Adresse", "adresse")}
            {renderField("Poste", "poste")}
            
            <div>
              <Label className="text-sm text-slate-600">Type de profil</Label>
              <p className="font-medium text-slate-800 mt-1 capitalize">{userData.profile}</p>
            </div>

            <div>
              <Label className="text-sm text-slate-600">Date de début</Label>
              <p className="font-medium text-slate-800 mt-1">
                {new Date(userData.dateDebut).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {userData.dateFin && (
              <div>
                <Label className="text-sm text-slate-600">Date de fin</Label>
                <p className="font-medium text-slate-800 mt-1">
                  {new Date(userData.dateFin).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Changement de mot de passe */}
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-600" />
              <h3 className="text-xl font-semibold text-slate-800">Sécurité</h3>
            </div>
            {!isChangingPassword && (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                Changer le mot de passe
              </Button>
            )}
          </div>

          {isChangingPassword ? (
            <div className="space-y-4">
              <div>
                <Label>Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Nouveau mot de passe</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div>
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handlePasswordSave}
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer le mot de passe
                </Button>
                <Button
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm">
              Votre mot de passe est protégé. Cliquez sur "Changer le mot de passe" pour le modifier.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      {/* {(userData.mission || userData.indemnite || userData.tarifJournalier || userData.tarifHoraire) && (
        <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-slate-800">Informations contractuelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData.mission && (
                <div>
                  <Label className="text-sm text-slate-600">Mission</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.mission}</p>
                </div>
              )}
              
              {userData.indemnite && (
                <div>
                  <Label className="text-sm text-slate-600">Indemnité</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.indemnite.toLocaleString()} Ar</p>
                </div>
              )}
              
              {userData.indemniteConnexion && (
                <div>
                  <Label className="text-sm text-slate-600">Indemnité de connexion</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.indemniteConnexion.toLocaleString()} Ar</p>
                </div>
              )}
              
              {userData.tarifJournalier && (
                <div>
                  <Label className="text-sm text-slate-600">Tarif journalier</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.tarifJournalier.toLocaleString()} Ar</p>
                </div>
              )}
              
              {userData.tarifHoraire && (
                <div>
                  <Label className="text-sm text-slate-600">Tarif horaire</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.tarifHoraire.toLocaleString()} Ar</p>
                </div>
              )}
              
              {userData.nombreJour && (
                <div>
                  <Label className="text-sm text-slate-600">Nombre de jours</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.nombreJour}</p>
                </div>
              )}
              
              {userData.horaire && (
                <div>
                  <Label className="text-sm text-slate-600">Horaire</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.horaire}</p>
                </div>
              )}

              {userData.domainePrestation && (
                <div>
                  <Label className="text-sm text-slate-600">Domaine de prestation</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.domainePrestation}</p>
                </div>
              )}

              {userData.dureeJournaliere && (
                <div>
                  <Label className="text-sm text-slate-600">Durée journalière</Label>
                  <p className="font-medium text-slate-800 mt-1">{userData.dureeJournaliere}h</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Déconnexion */}
      {/* <Card className="border-red-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-red-200/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Déconnexion</h3>
              <p className="text-sm text-slate-600 mt-1">Se déconnecter de votre compte</p>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Déconnexion
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}