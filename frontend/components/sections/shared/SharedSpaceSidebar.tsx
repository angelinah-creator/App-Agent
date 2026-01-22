"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Globe,
  Lock,
  Users,
  Camera,
  X,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { spaceService, Space, SpacePhoto } from "@/lib/space-service";
import SharedSpaceKanban from "./SharedSpaceKanban";

export default function EspacesPartageSection() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // États pour l'upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSpaces();
  }, []);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      
      let spacesData: Space[];
      
      if (userData.role === "admin" || userData.role === "manager") {
        spacesData = await spaceService.getAll();
      } else {
        spacesData = await spaceService.getMySpaces();
      }
      
      setSpaces(spacesData);
      
      if (spacesData.length > 0 && !selectedSpace) {
        setSelectedSpace(spacesData[0]);
      }
    } catch (error) {
      console.error("Erreur chargement espaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }

    // Validation de la taille (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximale : 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Créer l'aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhotoSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateSpace = async (name: string, description?: string) => {
    try {
      let photoData: SpacePhoto | undefined = undefined;

      // Si une photo est sélectionnée, l'uploader d'abord
      if (selectedFile) {
        setUploadingPhoto(true);
        photoData = await spaceService.uploadPhoto(selectedFile, name);
      }

      const newSpace = await spaceService.create({ 
        name, 
        description,
        photo: photoData 
      });
      
      setSpaces(prev => [...prev, newSpace]);
      setSelectedSpace(newSpace);
      setShowSpaceForm(false);
      clearPhotoSelection();
    } catch (error) {
      console.error("Erreur création espace:", error);
      alert("Erreur lors de la création de l'espace");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateSpace = async (spaceId: string, name: string, description?: string) => {
    try {
      let photoData: SpacePhoto | undefined = selectedSpace?.photo;

      // Si une nouvelle photo est sélectionnée, l'uploader
      if (selectedFile) {
        setUploadingPhoto(true);
        photoData = await spaceService.uploadPhoto(selectedFile, name);
      }

      const updatedSpace = await spaceService.update(spaceId, { 
        name, 
        description,
        photo: photoData 
      });
      
      setSpaces(prev => prev.map(s => s._id === spaceId ? updatedSpace : s));
      setSelectedSpace(updatedSpace);
      setShowEditForm(false);
      clearPhotoSelection();
    } catch (error) {
      console.error("Erreur mise à jour espace:", error);
      alert("Erreur lors de la mise à jour de l'espace");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!spaceToDelete) return;

    try {
      setDeleting(true);
      await spaceService.delete(spaceToDelete._id);
      
      setSpaces(prev => prev.filter(s => s._id !== spaceToDelete._id));
      
      // Si l'espace supprimé était sélectionné, sélectionner le premier disponible
      if (selectedSpace?._id === spaceToDelete._id) {
        const remainingSpaces = spaces.filter(s => s._id !== spaceToDelete._id);
        setSelectedSpace(remainingSpaces.length > 0 ? remainingSpaces[0] : null);
      }
      
      setShowDeleteConfirm(false);
      setSpaceToDelete(null);
    } catch (error) {
      console.error("Erreur suppression espace:", error);
      alert("Erreur lors de la suppression de l'espace");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (space: Space) => {
    setSelectedSpace(space);
    setShowEditForm(true);
    setOpenMenuId(null);
  };

  const openDeleteModal = (space: Space) => {
    setSpaceToDelete(space);
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return { role: 'collaborateur', prenoms: '', nom: '' };
    }
  };

  const userData = getUserData();
  const isAdminOrManager = userData.role === "admin" || userData.role === "manager";

  // Fonction pour obtenir les initiales d'un espace
  const getSpaceInitials = (spaceName: string) => {
    const words = spaceName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] text-gray-100 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des espaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-gray-100 flex">
      {/* Sidebar des espaces */}
      <div className="w-80 bg-[#1a1a1d] border-r border-gray-800 flex flex-col h-screen">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Espaces Partagés</h2>
            {isAdminOrManager && (
              <button
                onClick={() => setShowSpaceForm(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="Créer un espace"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Rechercher un espace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredSpaces.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Aucun espace trouvé</p>
              {isAdminOrManager && (
                <button
                  onClick={() => setShowSpaceForm(true)}
                  className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
                >
                  Créer un premier espace
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSpaces.map((space) => (
                <div
                  key={space._id}
                  className={`relative w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
                    selectedSpace?._id === space._id
                      ? "bg-[#6C4EA8] text-white"
                      : "hover:bg-gray-800"
                  }`}
                >
                  {/* Partie cliquable pour sélectionner l'espace */}
                  <button
                    onClick={() => setSelectedSpace(space)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {/* Photo ou initiales */}
                    <div className={`w-10 h-10 rounded flex items-center justify-center overflow-hidden flex-shrink-0 ${
                      space.photo ? 'bg-transparent' : space.isActive ? "bg-purple-900" : "bg-gray-500/20"
                    }`}>
                      {space.photo ? (
                        <img 
                          src={space.photo.url} 
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className={`font-semibold text-sm ${
                          space.isActive ? "text-white" : "text-gray-400"
                        }`}>
                          {getSpaceInitials(space.name)}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium truncate">{space.name}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {/* Par {space.createdBy.prenoms} {space.createdBy.nom} */}
                      </div>
                    </div>
                  </button>

                  {/* Menu 3 points (seulement pour admin/manager) */}
                  {isAdminOrManager && (
                    <div className="relative" ref={openMenuId === space._id ? menuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === space._id ? null : space._id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Menu déroulant */}
                      {openMenuId === space._id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#2a2a2d] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]">
                          <button
                            onClick={() => openEditModal(space)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 transition text-left"
                          >
                            <Edit size={16} />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(space)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/20 text-red-400 transition text-left"
                          >
                            <Trash2 size={16} />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="font-semibold">
                {userData.prenoms?.charAt(0) || ''}{userData.nom?.charAt(0) || ''}
              </span>
            </div>
            <div>
              <div className="font-medium">
                {userData.prenoms || ''} {userData.nom || ''}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {userData.role || 'utilisateur'}
                {isAdminOrManager && (
                  <span className="ml-2 text-purple-400">(Voir tous)</span>
                )}
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Contenu principal */}
      <div className="flex-1">
        {selectedSpace ? (
          <SharedSpaceKanban space={selectedSpace} />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-[#1a1a1d] rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun espace sélectionné</h3>
              <p className="text-gray-400 mb-6">
                {spaces.length === 0 
                  ? isAdminOrManager
                    ? "Créez votre premier espace partagé"
                    : "Vous n'êtes invité à aucun espace pour le moment"
                  : "Sélectionnez un espace dans la sidebar pour commencer"
                }
              </p>
              {isAdminOrManager && spaces.length === 0 && (
                <button
                  onClick={() => setShowSpaceForm(true)}
                  className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-6 py-2 rounded-lg transition"
                >
                  Créer un espace
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal création espace */}
      {showSpaceForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1d] rounded-xl w-full max-w-md border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Nouvel espace</h3>
              <button 
                onClick={() => {
                  setShowSpaceForm(false);
                  clearPhotoSelection();
                }} 
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* Upload photo */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Photo de l'espace</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                
                {previewUrl ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img 
                      src={previewUrl} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      onClick={clearPhotoSelection}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-32 h-32 mx-auto border-2 border-dashed border-gray-600 rounded cursor-pointer hover:border-purple-500 transition"
                  >
                    <Camera size={32} className="text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Ajouter une photo</span>
                  </label>
                )}
              </div>

              <input
                type="text"
                placeholder="Nom de l'espace*"
                id="spaceName"
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Description (optionnel)"
                id="spaceDescription"
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-purple-500 h-24 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('spaceName') as HTMLInputElement;
                    const descInput = document.getElementById('spaceDescription') as HTMLTextAreaElement;
                    const name = nameInput?.value || '';
                    const description = descInput?.value || '';
                    
                    if (name.trim()) {
                      handleCreateSpace(name, description);
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="flex-1 bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? 'Upload en cours...' : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setShowSpaceForm(false);
                    clearPhotoSelection();
                  }}
                  className="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal modification espace */}
      {showEditForm && selectedSpace && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1d] rounded-xl w-full max-w-md border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">Modifier l'espace</h3>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  clearPhotoSelection();
                }} 
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* Upload photo */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Photo de l'espace</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload-edit"
                />
                
                {previewUrl || selectedSpace.photo ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img 
                      src={previewUrl || selectedSpace.photo?.url} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      onClick={() => {
                        if (previewUrl) {
                          clearPhotoSelection();
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                    {!previewUrl && (
                      <label 
                        htmlFor="photo-upload-edit"
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer rounded"
                      >
                        <Camera size={24} className="text-white" />
                      </label>
                    )}
                  </div>
                ) : (
                  <label 
                    htmlFor="photo-upload-edit"
                    className="flex flex-col items-center justify-center w-32 h-32 mx-auto border-2 border-dashed border-gray-600 rounded cursor-pointer hover:border-purple-500 transition"
                  >
                    <Camera size={32} className="text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Ajouter une photo</span>
                  </label>
                )}
              </div>

              <input
                type="text"
                placeholder="Nom de l'espace*"
                id="spaceNameEdit"
                defaultValue={selectedSpace.name}
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-purple-500"
              />
              <textarea
                placeholder="Description (optionnel)"
                id="spaceDescriptionEdit"
                defaultValue={selectedSpace.description}
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-purple-500 h-24 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('spaceNameEdit') as HTMLInputElement;
                    const descInput = document.getElementById('spaceDescriptionEdit') as HTMLTextAreaElement;
                    const name = nameInput?.value || '';
                    const description = descInput?.value || '';
                    
                    if (name.trim()) {
                      handleUpdateSpace(selectedSpace._id, name, description);
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="flex-1 bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? 'Upload en cours...' : 'Modifier'}
                </button>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    clearPhotoSelection();
                  }}
                  className="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && spaceToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1d] rounded-xl w-full max-w-md border border-red-900/50">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h3 className="font-semibold text-red-400">Supprimer l'espace</h3>
              </div>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSpaceToDelete(null);
                }} 
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-300 mb-2">
                Êtes-vous sûr de vouloir supprimer l'espace <span className="font-semibold text-white">"{spaceToDelete.name}"</span> ?
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Cette action est irréversible. Toutes les données associées seront définitivement supprimées.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteSpace}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Supprimer
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSpaceToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}