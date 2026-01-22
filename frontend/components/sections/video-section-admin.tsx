"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Upload, Edit, Trash2, Plus, Check, X, AlertCircle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoService, type Video as VideoType, type Chapter, type UpdateVideoData } from '@/lib/video-service';

interface VideoUploadForm {
  title: string;
  description: string;
  file: File | null;
  chapters: Chapter[];
}

interface ChapterForm {
  title: string;
  description: string;
  startTime: string; // format: "mm:ss"
  endTime: string; // format: "mm:ss" (optionnel)
}

export function VideoSectionAdmin() {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Formulaire d'upload
  const [uploadForm, setUploadForm] = useState<VideoUploadForm>({
    title: "",
    description: "",
    file: null,
    chapters: [],
  });

  // Formulaire de chapitre
  const [chapterForm, setChapterForm] = useState<ChapterForm>({
    title: "",
    description: "",
    startTime: "00:00",
    endTime: "",
  });

  // Gestion du fichier upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert("La vidéo est trop volumineuse. Taille maximum: 500MB");
        return;
      }
      
      // Vérifier le type
      if (!file.type.startsWith("video/")) {
        alert("Veuillez sélectionner un fichier vidéo valide");
        return;
      }

      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  // Récupérer la vidéo
  const { data: video, isLoading, error } = useQuery({
    queryKey: ["video"],
    queryFn: () => videoService.getActiveVideo().catch(() => null),
    refetchOnWindowFocus: false,
  });

  // Écouter les événements de la vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handleTimeUpdate = () => {
      if (videoElement) {
        setCurrentTime(videoElement.currentTime);
      }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [video]);

  // Mutation pour uploader une vidéo
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadForm.file) throw new Error("Aucun fichier sélectionné");
      
      const formData = new FormData();
      formData.append("video", uploadForm.file);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      
      if (uploadForm.chapters.length > 0) {
        formData.append("chapters", JSON.stringify(uploadForm.chapters));
      }

      return await videoService.uploadVideo(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      
      // Réinitialiser le formulaire
      setUploadForm({
        title: "",
        description: "",
        file: null,
        chapters: [],
      });
      
      alert("Vidéo uploadée avec succès !");
    },
    onError: (error: any) => {
      console.error("Erreur upload:", error);
      alert(error.response?.data?.message || "Erreur lors de l'upload de la vidéo");
    },
  });

  // Mutation pour mettre à jour une vidéo
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVideoData }) =>
      videoService.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    },
    onError: (error: any) => {
      console.error("Erreur mise à jour:", error);
      alert(error.response?.data?.message || "Erreur lors de la mise à jour");
    },
  });

  // Mutation pour supprimer une vidéo
  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      setShowDeleteConfirm(false);
      alert("Vidéo supprimée avec succès !");
    },
    onError: (error: any) => {
      console.error("Erreur suppression:", error);
      alert(error.response?.data?.message || "Erreur lors de la suppression");
    },
  });

  // Convertir mm:ss en secondes
  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  // Convertir secondes en mm:ss
  const secondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculer la progression d'un chapitre
  const calculateChapterProgress = (chapter: Chapter): number => {
    if (!videoRef.current || !video) return 0;
    
    const duration = videoRef.current.duration || video.duration;
    
    // Si le chapitre a une fin définie
    if (chapter.endTime !== undefined) {
      if (currentTime >= chapter.endTime) return 100;
      if (currentTime <= chapter.startTime) return 0;
      
      const chapterDuration = chapter.endTime - chapter.startTime;
      const progressInChapter = currentTime - chapter.startTime;
      return (progressInChapter / chapterDuration) * 100;
    }
    
    // Si pas de fin définie, on considère la fin de la vidéo
    if (currentTime >= duration) return 100;
    if (currentTime <= chapter.startTime) return 0;
    
    const chapterDuration = duration - chapter.startTime;
    const progressInChapter = currentTime - chapter.startTime;
    return (progressInChapter / chapterDuration) * 100;
  };

  // Vérifier si un chapitre est complété
  const isChapterCompleted = (chapter: Chapter): boolean => {
    if (!video) return false;
    
    if (chapter.endTime !== undefined) {
      return currentTime >= chapter.endTime;
    }
    
    // Si pas de fin définie, chapitre complété à la fin de la vidéo
    return currentTime >= (videoRef.current?.duration || video.duration);
  };

  // Ajouter/modifier un chapitre
  const handleSaveChapter = () => {
    if (!video) return;

    const newChapter: Chapter = {
      title: chapterForm.title,
      description: chapterForm.description,
      startTime: timeToSeconds(chapterForm.startTime),
      endTime: chapterForm.endTime ? timeToSeconds(chapterForm.endTime) : undefined,
    };

    const updatedChapters = [...(video?.chapters || [])];
    
    if (editingChapterIndex !== null) {
      updatedChapters[editingChapterIndex] = newChapter;
    } else {
      updatedChapters.push(newChapter);
    }

    // Trier les chapitres par startTime
    updatedChapters.sort((a, b) => a.startTime - b.startTime);

    updateMutation.mutate({
      id: video._id,
      data: { chapters: updatedChapters }
    });

    // Réinitialiser le formulaire
    setChapterForm({
      title: "",
      description: "",
      startTime: "00:00",
      endTime: "",
    });
    setEditingChapterIndex(null);
    setShowChapterForm(false);
  };

  // Modifier un chapitre existant
  const handleEditChapter = (index: number) => {
    const chapter = video?.chapters[index];
    if (chapter) {
      setChapterForm({
        title: chapter.title,
        description: chapter.description || "",
        startTime: secondsToTime(chapter.startTime),
        endTime: chapter.endTime ? secondsToTime(chapter.endTime) : "",
      });
      setEditingChapterIndex(index);
      setShowChapterForm(true);
    }
  };

  // Supprimer un chapitre
  const handleDeleteChapter = (index: number) => {
    if (!video || !window.confirm("Supprimer ce chapitre ?")) return;
    
    const updatedChapters = video.chapters.filter((_, i) => i !== index);
    updateMutation.mutate({
      id: video._id,
      data: { chapters: updatedChapters }
    });
  };

  // Aller à un chapitre dans la vidéo
  const seekToChapter = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Formater la durée
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formater le temps courant
  const formatCurrentTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse bg-[#14141A] p-10 rounded-xl border border-[#2E2E38] h-96"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* En-tête */}
      <div>
        <h2 className="text-3xl font-extrabold text-white">Gestion de la Vidéo Onboarding</h2>
        <p className="text-gray-400">
          {video 
            ? "Gérez la vidéo et ses chapitres" 
            : "Uploader une vidéo d'onboarding"}
        </p>
      </div>

      {!video ? (
        /* Écran d'upload - quand aucune vidéo n'existe */
        <div className="bg-[#14141A] p-8 rounded-xl border border-[#2E2E38]">
          <h3 className="text-2xl font-bold text-white mb-6">
            Uploader la vidéo d'onboarding
          </h3>

          {/* Formulaire d'upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre de la vidéo *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-4 py-3 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white focus:border-[#6C4EA8] focus:outline-none"
                placeholder="Ex: Introduction à Code-Talent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                className="w-full px-4 py-3 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white focus:border-[#6C4EA8] focus:outline-none h-32 resize-none"
                placeholder="Description de la vidéo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fichier vidéo *
              </label>
              <div className="border-2 border-dashed border-[#2E2E38] rounded-lg p-8 text-center hover:border-[#6C4EA8] transition-colors">
                {uploadForm.file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Video className="w-8 h-8 text-[#6C4EA8]" />
                      <div className="text-left">
                        <p className="font-medium text-white">{uploadForm.file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadForm({...uploadForm, file: null})}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Changer de fichier
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      Glissez-déposez votre fichier vidéo ici
                    </p>
                    <p className="text-sm text-gray-500 mb-4">ou</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileSelect}
                      />
                      <span className="px-6 py-3 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors font-medium inline-block">
                        Parcourir les fichiers
                      </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-4">
                      Formats supportés: MP4, WebM, MOV, AVI
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !uploadForm.title || !uploadForm.file}
                className="px-8 py-3 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="inline w-5 h-5 mr-2" />
                    Uploader la vidéo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Écran de gestion - quand une vidéo existe */
        <div className="space-y-6">
          {/* Aperçu de la vidéo */}
          <div className="bg-[#14141A] p-6 rounded-xl border border-[#2E2E38]">
            <div className="flex justify-between items-start mb-6">
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="px-3 py-1 bg-[#1E1E28] border border-[#6C4EA8] rounded text-white text-xl font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (newTitle.trim() && newTitle !== video.title) {
                          updateMutation.mutate({
                            id: video._id,
                            data: { title: newTitle }
                          });
                        } else {
                          setIsEditingTitle(false);
                        }
                      }}
                      className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">{video.title}</h3>
                    <button
                      onClick={() => {
                        setNewTitle(video.title);
                        setIsEditingTitle(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isEditingDescription ? (
                  <div className="flex items-start gap-2 mb-2">
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="flex-1 px-3 py-1 bg-[#1E1E28] border border-[#6C4EA8] rounded text-gray-400 text-sm"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          updateMutation.mutate({
                            id: video._id,
                            data: { description: newDescription }
                          });
                        }}
                        className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mb-4">
                    <p className="text-gray-400 text-sm">
                      {video.description || "Aucune description"}
                    </p>
                    <button
                      onClick={() => {
                        setNewDescription(video.description || "");
                        setIsEditingDescription(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Durée: {formatDuration(video.duration)}</span>
                  <span>
                    Uploadé le {new Date(video.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors font-medium"
              >
                <Trash2 className="inline w-4 h-4 mr-2" />
                Supprimer
              </button>
            </div>

            {/* Lecteur vidéo */}
            <div className="mb-4">
              <video
                ref={videoRef}
                controls
                className="rounded-lg w-full h-auto max-h-[500px] bg-black"
                poster={video.url.replace(/\.[^/.]+$/, '.jpg')} // Miniature Cloudinary
              >
                <source src={video.url} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          </div>

          {/* Gestion des chapitres */}
          <div className="bg-[#14141A] p-6 rounded-xl border border-[#2E2E38]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Liste des chapitres dans la vidéo</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {video.chapters?.length || 0} chapitres • Cliquez sur un chapitre pour y accéder
                </p>
              </div>
              <button
                onClick={() => setShowChapterForm(true)}
                className="px-4 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors font-medium text-sm"
              >
                <Plus className="inline w-4 h-4 mr-2" />
                Ajouter un chapitre
              </button>
            </div>

            {showChapterForm && (
              <div className="bg-[#1E1E28] p-6 rounded-lg border border-[#2E2E38] mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  {editingChapterIndex !== null ? "Modifier le chapitre" : "Nouveau chapitre"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({...chapterForm, title: e.target.value})}
                      className="w-full px-4 py-2 bg-[#262633] border border-[#2E2E38] rounded-lg text-white"
                      placeholder="Introduction, Conclusion, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm({...chapterForm, description: e.target.value})}
                      className="w-full px-4 py-2 bg-[#262633] border border-[#2E2E38] rounded-lg text-white"
                      placeholder="Description du chapitre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Heure de début (mm:ss) *
                    </label>
                    <input
                      type="text"
                      value={chapterForm.startTime}
                      onChange={(e) => setChapterForm({...chapterForm, startTime: e.target.value})}
                      className="w-full px-4 py-2 bg-[#262633] border border-[#2E2E38] rounded-lg text-white"
                      placeholder="00:00"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Heure de fin (mm:ss)
                    </label>
                    <input
                      type="text"
                      value={chapterForm.endTime}
                      onChange={(e) => setChapterForm({...chapterForm, endTime: e.target.value})}
                      className="w-full px-4 py-2 bg-[#262633] border border-[#2E2E38] rounded-lg text-white"
                      placeholder="01:30"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveChapter}
                    disabled={!chapterForm.title || !chapterForm.startTime}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="inline w-4 h-4 mr-2" />
                    {editingChapterIndex !== null ? "Modifier" : "Ajouter"}
                  </button>
                  <button
                    onClick={() => {
                      setShowChapterForm(false);
                      setEditingChapterIndex(null);
                      setChapterForm({
                        title: "",
                        description: "",
                        startTime: "00:00",
                        endTime: "",
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    <X className="inline w-4 h-4 mr-2" />
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {video.chapters && video.chapters.length > 0 ? (
              <div className="flex flex-col gap-4">
                {video.chapters.map((chapter, index) => {
                  const isCompleted = currentTime >= chapter.startTime;
                  const chapterProgress = calculateChapterProgress(chapter);
                  
                  return (
                    <div
                      key={index}
                      className={`border border-[#2E2E38] p-5 rounded-xl flex gap-4 items-start cursor-pointer hover:border-[#6C4EA8] transition-colors group ${
                        isCompleted ? 'bg-[#9AFFB524]' : 'bg-[#1E1E28]'
                      }`}
                      onClick={() => seekToChapter(chapter.startTime)}
                    >
                      <CheckCircle 
                        className={`w-6 h-6 flex-shrink-0 ${
                          isCompleted ? 'text-green-400' : 'text-gray-400'
                        }`} 
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-xl ${
                            isCompleted ? 'text-[#71D296]' : 'text-white'
                          }`}>
                            {chapter.title}
                          </h3>
                          {isCompleted && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Complété
                            </span>
                          )}
                        </div>
                        {chapter.description && (
                          <p className="text-gray-400 text-sm mb-2">{chapter.description}</p>
                        )}
                        
                        {/* Barre de progression du chapitre */}
                        <div className="w-full bg-[#262633] h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${chapterProgress}%` }}
                            className="h-full bg-[#6C4EA8] transition-all duration-300"
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-gray-400 text-xs mt-1">
                          <span>
                            {Math.floor(chapter.startTime / 60)}:{(chapter.startTime % 60).toFixed(0).padStart(2, '0')}
                            {chapter.endTime && ` - ${Math.floor(chapter.endTime / 60)}:${(chapter.endTime % 60).toFixed(0).padStart(2, '0')}`}
                          </span>
                          <span>{Math.round(chapterProgress)}%</span>
                        </div>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="flex gap-2 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(index);
                          }}
                          className="flex items-center gap-2 p-2 text-blue-400 border-blue-400 border hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" /> Modifier
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(index);
                          }}
                          className=" flex items-center gap-2 p-2 text-red-400 border-red-400 border hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun chapitre défini pour cette vidéo.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Ajoutez des chapitres pour aider les utilisateurs à naviguer dans la vidéo
                </p>
                <button
                  onClick={() => setShowChapterForm(true)}
                  className="mt-4 px-4 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors font-medium text-sm"
                >
                  <Plus className="inline w-4 h-4 mr-2" />
                  Ajouter votre premier chapitre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#14141A] rounded-xl p-6 max-w-md w-full border border-[#2E2E38]">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Supprimer la vidéo ?
              </h3>
              <p className="text-gray-400 mb-6">
                Tous les chapitres seront également supprimés. Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-[#2E2E38] text-gray-400 rounded-lg hover:bg-white/5 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteMutation.mutate(video!._id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}