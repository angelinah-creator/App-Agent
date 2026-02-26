"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { X, Camera, User, Mail, Phone, Lock, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usersService } from "@/lib/users-service"
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog"

interface ProfileModalProps {
  user: any
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  const queryClient = useQueryClient()
  const { confirm, dialog } = useConfirmDialog()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [isLoading, setIsLoading] = useState(false)
  
  // État pour les informations
  const [userInfo, setUserInfo] = useState({
    nom: user.nom || '',
    prenoms: user.prenoms || '',
    email: user.email || '',
    telephone: user.telephone || ''
  })
  
  // État pour le changement de mot de passe
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // État pour la photo
  const [previewPhoto, setPreviewPhoto] = useState(user.profilePhoto?.url || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Mutation pour la mise à jour des informations
  const updateInfoMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        nom: userInfo.nom,
        prenoms: userInfo.prenoms,
        email: userInfo.email,
        telephone: userInfo.telephone
      }
      
      if (selectedFile) {
        data.profilePhoto = selectedFile
      }
      
      return usersService.updatePersonalInfo(user._id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      alert('Informations mises à jour avec succès')
      onClose()
    },
    onError: (error: any) => {
      alert(error.message || 'Erreur lors de la mise à jour')
    }
  })

  // Mutation pour le changement de mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: () => 
      usersService.changePassword(
        user._id, 
        passwordInfo.currentPassword, 
        passwordInfo.newPassword
      ),
    onSuccess: () => {
      alert('Mot de passe changé avec succès')
      setPasswordInfo({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setActiveTab('info')
    },
    onError: (error: any) => {
      alert(error.message || 'Erreur lors du changement de mot de passe')
    }
  })

  // Mutation pour la suppression de photo
  const deletePhotoMutation = useMutation({
    mutationFn: () => usersService.deleteProfilePhoto(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setPreviewPhoto('')
      setSelectedFile(null)
      alert('Photo supprimée avec succès')
    },
    onError: (error: any) => {
      alert(error.message || 'Erreur lors de la suppression')
    }
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB')
        return
      }
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        alert('Le fichier doit être une image')
        return
      }
      
      setSelectedFile(file)
      
      // Créer une preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    confirm({
      title: 'Supprimer la photo de profil',
      description: 'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: () => {
        deletePhotoMutation.mutate()
      }
    })
  }

  const handleSaveInfo = () => {
    updateInfoMutation.mutate()
  }

  const handleChangePassword = () => {
    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }
    
    if (passwordInfo.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    
    changePasswordMutation.mutate()
  }

  if (!isOpen) return null

  const getInitials = () => {
    return `${user.prenoms?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
  }

  return (
    <>
      {dialog}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1F2128] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#313442]">
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-[#313442]">
            <div className="flex items-center gap-4">
              <div className="relative">
                {previewPhoto ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-[#6C4EA8]">
                    <img 
                      src={previewPhoto} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#6C4EA8] flex items-center justify-center text-white font-semibold text-xl">
                    {getInitials()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#6C4EA8] rounded-full flex items-center justify-center hover:bg-[#7d5bb9] transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.prenoms} {user.nom}
                </h2>
                <p className="text-gray-400 capitalize">
                  {user.role} {user.profile ? `• ${user.profile}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Onglets */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#6C4EA8] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Informations
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'bg-[#6C4EA8] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </button>
            </div>

            {/* Tab Informations */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-gray-300">
                      Nom
                    </Label>
                    <Input
                      id="nom"
                      value={userInfo.nom}
                      onChange={(e) => setUserInfo({...userInfo, nom: e.target.value})}
                      className="bg-[#2A2C35] border-[#3A3C45] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenoms" className="text-gray-300">
                      Prénom(s)
                    </Label>
                    <Input
                      id="prenoms"
                      value={userInfo.prenoms}
                      onChange={(e) => setUserInfo({...userInfo, prenoms: e.target.value})}
                      className="bg-[#2A2C35] border-[#3A3C45] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                    className="bg-[#2A2C35] border-[#3A3C45] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-gray-300">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Téléphone
                  </Label>
                  <Input
                    id="telephone"
                    value={userInfo.telephone}
                    onChange={(e) => setUserInfo({...userInfo, telephone: e.target.value})}
                    className="bg-[#2A2C35] border-[#3A3C45] text-white"
                  />
                </div>

                {/* Actions photo */}
                <div className="pt-4 border-t border-[#313442]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Photo de profil</h4>
                      <p className="text-sm text-gray-400">
                        {previewPhoto ? 'Photo sélectionnée' : 'Aucune photo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="border-[#3A3C45] text-gray-300 hover:text-white hover:bg-white/5"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Changer
                      </Button>
                      {user.profilePhoto?.url && (
                        <Button
                          onClick={handleRemovePhoto}
                          variant="destructive"
                          size="sm"
                          disabled={deletePhotoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Mot de passe */}
            {activeTab === 'password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-300">
                    Mot de passe actuel
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordInfo.currentPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, currentPassword: e.target.value})}
                    className="bg-[#2A2C35] border-[#3A3C45] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-300">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordInfo.newPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, newPassword: e.target.value})}
                    className="bg-[#2A2C35] border-[#3A3C45] text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 6 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordInfo.confirmPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, confirmPassword: e.target.value})}
                    className="bg-[#2A2C35] border-[#3A3C45] text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="p-6 border-t border-[#313442] flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#3A3C45] text-gray-300 hover:text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={activeTab === 'info' ? handleSaveInfo : handleChangePassword}
              disabled={
                updateInfoMutation.isPending || 
                changePasswordMutation.isPending ||
                (activeTab === 'password' && 
                 (!passwordInfo.currentPassword || 
                  !passwordInfo.newPassword || 
                  !passwordInfo.confirmPassword))
              }
              className="bg-[#6C4EA8] hover:bg-[#7d5bb9] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {activeTab === 'info' 
                ? 'Enregistrer les modifications' 
                : 'Changer le mot de passe'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}