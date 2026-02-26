"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Upload, Edit, Trash2, Plus, Check, X, CheckCircle } from "lucide-react";
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
  startTime: string;
  endTime: string;
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
  
  const [uploadForm, setUploadForm] = useState<VideoUploadForm>({
    title: "",
    description: "",
    file: null,
    chapters: [],
  });

  const [chapterForm, setChapterForm] = useState<ChapterForm>({
    title: "",
    description: "",
    startTime: "00:00",
    endTime: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert("La vidéo est trop volumineuse. Max: 500MB");
        return;
      }
      
      if (!file.type.startsWith("video/")) {
        alert("Veuillez sélectionner un fichier vidéo valide");
        return;
      }

      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const { data: video, isLoading } = useQuery({
    queryKey: ["video"],
    queryFn: () => videoService.getActiveVideo().catch(() => null),
    refetchOnWindowFocus: false,
  });

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
      setUploadForm({ title: "", description: "", file: null, chapters: [] });
      alert("Vidéo uploadée avec succès !");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de l'upload");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVideoData }) =>
      videoService.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de la mise à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video"] });
      setShowDeleteConfirm(false);
      alert("Vidéo supprimée !");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de la suppression");
    },
  });

  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  const secondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateChapterProgress = (chapter: Chapter): number => {
    if (!videoRef.current || !video) return 0;
    
    const duration = videoRef.current.duration || video.duration;
    
    if (chapter.endTime !== undefined) {
      if (currentTime >= chapter.endTime) return 100;
      if (currentTime <= chapter.startTime) return 0;
      
      const chapterDuration = chapter.endTime - chapter.startTime;
      const progressInChapter = currentTime - chapter.startTime;
      return (progressInChapter / chapterDuration) * 100;
    }
    
    if (currentTime >= duration) return 100;
    if (currentTime <= chapter.startTime) return 0;
    
    const chapterDuration = duration - chapter.startTime;
    const progressInChapter = currentTime - chapter.startTime;
    return (progressInChapter / chapterDuration) * 100;
  };

  const isChapterCompleted = (chapter: Chapter): boolean => {
    if (!video) return false;
    
    if (chapter.endTime !== undefined) {
      return currentTime >= chapter.endTime;
    }
    
    return currentTime >= (videoRef.current?.duration || video.duration);
  };

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

    updatedChapters.sort((a, b) => a.startTime - b.startTime);

    updateMutation.mutate({
      id: video._id,
      data: { chapters: updatedChapters }
    });

    setChapterForm({ title: "", description: "", startTime: "00:00", endTime: "" });
    setEditingChapterIndex(null);
    setShowChapterForm(false);
  };

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

  const handleDeleteChapter = (index: number) => {
    if (!video || !window.confirm("Supprimer ce chapitre ?")) return;
    
    const updatedChapters = video.chapters.filter((_, i) => i !== index);
    updateMutation.mutate({
      id: video._id,
      data: { chapters: updatedChapters }
    });
  };

  const seekToChapter = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="animate-pulse bg-[#14141A] p-6 rounded-lg border border-[#2E2E38] h-64"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 -mt-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Gestion Vidéo Onboarding</h2>
        <p className="text-gray-400 text-sm">
          {video ? "Gérez la vidéo et ses chapitres" : "Uploader une vidéo d'onboarding"}
        </p>
      </div>

      {!video ? (
        <div className="bg-[#14141A] p-6 rounded-lg border border-[#2E2E38]">
          <h3 className="text-lg font-bold text-white mb-4">Uploader la vidéo d'onboarding</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Titre *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-3 py-2 bg-[#1E1E28] border border-[#2E2E38] rounded text-white text-sm focus:border-[#6C4EA8]"
                placeholder="Ex: Introduction à Code-Talent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                className="w-full px-3 py-2 bg-[#1E1E28] border border-[#2E2E38] rounded text-white text-sm focus:border-[#6C4EA8] h-24 resize-none"
                placeholder="Description de la vidéo..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Fichier vidéo *</label>
              <div className="border border-dashed border-[#2E2E38] rounded p-4 text-center hover:border-[#6C4EA8] transition-colors">
                {uploadForm.file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Video className="w-6 h-6 text-[#6C4EA8]" />
                      <div className="text-left">
                        <p className="font-medium text-white text-sm">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-400">
                          {(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadForm({...uploadForm, file: null})}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs"
                    >
                      Changer de fichier
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Glissez-déposez votre fichier vidéo</p>
                    <p className="text-xs text-gray-500 mb-2">ou</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileSelect}
                      />
                      <span className="px-4 py-2 bg-[#6C4EA8] text-white rounded hover:bg-[#5a3d8a] transition-colors font-medium text-xs inline-block">
                        Parcourir les fichiers
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Formats: MP4, WebM, MOV, AVI</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !uploadForm.title || !uploadForm.file}
                className="px-6 py-2 bg-[#6C4EA8] text-white rounded hover:bg-[#5a3d8a] transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="inline w-4 h-4 mr-2" />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#14141A] p-4 rounded-lg border border-[#2E2E38]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1 mb-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="px-2 py-1 bg-[#1E1E28] border border-[#6C4EA8] rounded text-white font-bold text-sm"
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
                      className="p-0.5 text-green-400 hover:bg-green-500/10 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-0.5 text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mb-2">
                    <h3 className="text-lg font-bold text-white">{video.title}</h3>
                    <button
                      onClick={() => {
                        setNewTitle(video.title);
                        setIsEditingTitle(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded flex items-center gap-1 border-gray-400 border text-sm font-semibold"
                    >
                      <Edit className="w-4 h-4" />  Modifier le titre
                    </button>
                  </div>
                )}

                {isEditingDescription ? (
                  <div className="flex items-start gap-1 mb-2">
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="flex-1 px-2 py-1 bg-[#1E1E28] border border-[#6C4EA8] rounded text-gray-400 text-xs"
                      rows={1}
                      autoFocus
                    />
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          updateMutation.mutate({
                            id: video._id,
                            data: { description: newDescription }
                          });
                        }}
                        className="p-0.5 text-green-400 hover:bg-green-500/10 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="p-0.5 text-red-400 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1 mb-3">
                    <p className="text-gray-400 text-xs flex-1">
                      {video.description || "Aucune description"}
                    </p>
                    <button
                      onClick={() => {
                        setNewDescription(video.description || "");
                        setIsEditingDescription(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded flex items-center gap-1 border-gray-400 border text-sm font-semibold"
                    >
                      <Edit className="w-4 h-4" /> Modifier la description
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Durée: {formatDuration(video.duration)}</span>
                  <span>Uploadé: {new Date(video.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 border border-red-500/20 text-red-400 rounded hover:bg-red-500/10 transition-colors font-medium text-sm -mt-2"
              >
                <Trash2 className="inline w-4 h-4 mr-1" />
                Supprimer la video
              </button>
            </div>

            {/* Lecteur vidéo adaptatif */}
            <div className="mb-3">
              <div className="relative bg-black rounded overflow-hidden max-w-4xl mx-auto">
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-auto max-h-[400px]"
                  style={{
                    aspectRatio: "16/9", // Ratio standard pour les vidéos
                    objectFit: "contain" // Garde les proportions de la vidéo
                  }}
                  poster={video.url.replace(/\.[^/.]+$/, '.jpg')}
                >
                  <source src={video.url} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              </div>
            </div>
          </div>

          {/* Gestion des chapitres */}
          <div className="bg-[#14141A] p-4 rounded-lg border border-[#2E2E38]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Liste des chapitres</h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  {video.chapters?.length || 0} chapitres • Cliquez pour accéder
                </p>
              </div>
              <button
                onClick={() => setShowChapterForm(true)}
                className="px-3 py-1.5 bg-[#6C4EA8] text-white rounded hover:bg-[#5a3d8a] transition-colors font-medium text-xs"
              >
                <Plus className="inline w-3 h-3 mr-1" />
                Ajouter
              </button>
            </div>

            {showChapterForm && (
              <div className="bg-[#1E1E28] p-4 rounded border border-[#2E2E38] mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  {editingChapterIndex !== null ? "Modifier chapitre" : "Nouveau chapitre"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({...chapterForm, title: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-sm"
                      placeholder="Introduction, Conclusion..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm({...chapterForm, description: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-sm"
                      placeholder="Description du chapitre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Début (mm:ss) *</label>
                    <input
                      type="text"
                      value={chapterForm.startTime}
                      onChange={(e) => setChapterForm({...chapterForm, startTime: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-sm"
                      placeholder="00:00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Fin (mm:ss)</label>
                    <input
                      type="text"
                      value={chapterForm.endTime}
                      onChange={(e) => setChapterForm({...chapterForm, endTime: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-sm"
                      placeholder="01:30"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChapter}
                    disabled={!chapterForm.title || !chapterForm.startTime}
                    className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs disabled:opacity-50"
                  >
                    <Check className="inline w-3 h-3 mr-1" />
                    {editingChapterIndex !== null ? "Modifier" : "Ajouter"}
                  </button>
                  <button
                    onClick={() => {
                      setShowChapterForm(false);
                      setEditingChapterIndex(null);
                      setChapterForm({ title: "", description: "", startTime: "00:00", endTime: "" });
                    }}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                  >
                    <X className="inline w-3 h-3 mr-1" />
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {video.chapters && video.chapters.length > 0 ? (
              <div className="flex flex-col gap-3">
                {video.chapters.map((chapter, index) => {
                  const isCompleted = currentTime >= chapter.startTime;
                  const chapterProgress = calculateChapterProgress(chapter);
                  
                  return (
                    <div
                      key={index}
                      className={`border border-[#2E2E38] p-3 rounded-lg flex gap-3 cursor-pointer hover:border-[#6C4EA8] transition-colors group items-center ${
                        isCompleted ? 'bg-[#9AFFB524]' : 'bg-[#1E1E28]'
                      }`}
                      onClick={() => seekToChapter(chapter.startTime)}
                    >
                      <CheckCircle 
                        className={`w-7 h-7 flex-shrink-0 mt-0.5 ${
                          isCompleted ? 'text-green-400' : 'text-gray-400'
                        }`} 
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <h3 className={`font-medium text-base ${
                            isCompleted ? 'text-[#71D296]' : 'text-white'
                          }`}>
                            {chapter.title}
                          </h3>
                        </div>
                        {chapter.description && (
                          <p className="text-gray-400 text-xs mb-1.5">{chapter.description}</p>
                        )}
                        
                        <div className="w-full bg-[#262633] h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${chapterProgress}%` }}
                            className="h-full bg-[#6C4EA8] transition-all duration-300"
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-gray-400 text-[10px] mt-0.5">
                          <span>
                            {Math.floor(chapter.startTime / 60)}:{(chapter.startTime % 60).toFixed(0).padStart(2, '0')}
                            {chapter.endTime && ` - ${Math.floor(chapter.endTime / 60)}:${(chapter.endTime % 60).toFixed(0).padStart(2, '0')}`}
                          </span>
                          <span>{Math.round(chapterProgress)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(index);
                          }}
                          className="p-1 text-blue-400 border-2 border-blue-500 hover:bg-blue-500/10 rounded flex items-center gap-1 text-sm"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />Modifier
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(index);
                          }}
                          className="p-1 text-red-400 border-2 border-red-400 hover:bg-red-500/10 rounded flex items-center gap-1 text-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Video className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun chapitre défini.</p>
                <button
                  onClick={() => setShowChapterForm(true)}
                  className="mt-3 px-3 py-1.5 bg-[#6C4EA8] text-white rounded hover:bg-[#5a3d8a] transition-colors text-xs"
                >
                  <Plus className="inline w-3 h-3 mr-1" />
                  Ajouter un chapitre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#14141A] rounded-lg p-5 max-w-sm w-full border border-[#2E2E38]">
            <div className="text-center">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Supprimer la vidéo ?</h3>
              <p className="text-gray-400 text-xs mb-4">
                Tous les chapitres seront supprimés. Action irréversible.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 border border-[#2E2E38] text-gray-400 rounded hover:bg-white/5 text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteMutation.mutate(video!._id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}