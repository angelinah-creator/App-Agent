"use client";

import { useState } from "react";
import { Upload, Video, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoService, Video as VideoType } from "@/lib/video-service";
import { VideoCard } from "./videos/VideoCard";
import { VideoPlayer } from "./videos/VideoPlayer";
import { UploadVideoModal } from "./videos/UploadVideoModal";
import { EditVideoModal } from "./videos/EditVideoModal";

export function VideoSectionAdmin() {
  const queryClient = useQueryClient();
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoType | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos-admin"],
    queryFn: () => videoService.getVideosAdmin(),
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos-admin"] });
      setDeletingVideo(null);
    },
    onError: (err: any) => alert(err?.response?.data?.message || "Erreur suppression"),
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-[#2E2E38] rounded w-48 animate-pulse" />
          <div className="h-10 bg-[#2E2E38] rounded w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-[#14141A] border border-[#2E2E38] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">Gestion des Vidéos</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            {videos.length} vidéo{videos.length > 1 ? "s" : ""} · Gérez le contenu d'onboarding
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors font-semibold text-xs md:text-sm shadow-lg shadow-[#6C4EA8]/25 w-full sm:w-auto"
        >
          <Upload className="w-4 h-4" />
          Uploader une vidéo
        </button>
      </div>

      {/* Grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#14141A] border border-dashed border-[#2E2E38] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#1E1E28] flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Aucune vidéo</h3>
          <p className="text-gray-500 text-sm mb-5">Uploadez votre première vidéo d'onboarding</p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Uploader une vidéo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              isAdmin
              onPlay={setPlayingVideo}
              onEdit={setEditingVideo}
              onDelete={setDeletingVideo}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && <UploadVideoModal onClose={() => setShowUpload(false)} />}
      {editingVideo && <EditVideoModal video={editingVideo} onClose={() => setEditingVideo(null)} />}
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}

      {/* Delete confirm */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14141A] border border-[#2E2E38] rounded-xl p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Supprimer la vidéo ?</h3>
              <p className="text-gray-400 text-sm mb-1 font-medium">{deletingVideo.title}</p>
              <p className="text-gray-500 text-xs mb-5">
                Cette action est irréversible. La vidéo sera supprimée de Cloudinary.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeletingVideo(null)}
                  className="flex-1 py-2 border border-[#2E2E38] text-gray-400 rounded-lg hover:bg-white/5 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingVideo._id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
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