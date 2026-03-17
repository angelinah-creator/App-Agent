"use client";

import { useState } from "react";
import { Video, Trophy, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { videoService, Video as VideoType, VideoProgress } from "@/lib/video-service";
import { VideoCard } from "./videos/VideoCard";
import { VideoPlayer } from "./videos/VideoPlayer";

// ─── Barre de progression ──────────────────────────────────────────────────
function VideoProgressBar({ progress }: { progress: VideoProgress }) {
  const { watchedCount, totalCount, percentage } = progress;

  const getColor = () => {
    if (percentage >= 100) return { bar: "from-green-500 to-emerald-400", text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" };
    if (percentage >= 60) return { bar: "from-[#6C4EA8] to-[#A78BFA]", text: "text-[#A78BFA]", bg: "bg-[#6C4EA8]/10 border-[#6C4EA8]/20" };
    if (percentage >= 30) return { bar: "from-blue-500 to-blue-400", text: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" };
    return { bar: "from-gray-500 to-gray-400", text: "text-gray-400", bg: "bg-gray-400/10 border-gray-400/20" };
  };

  const colors = getColor();

  return (
    <div className={`rounded-xl border px-4 md:px-5 py-4 -mt-2 md:-mt-8 ${colors.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2.5">
          {percentage >= 100 ? (
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
          ) : (
            <Video className={`w-5 h-5 md:w-6 md:h-6 ${colors.text} flex-shrink-0`} />
          )}
          <div className="min-w-0">
            <p className="text-white text-sm md:text-base font-semibold truncate">
              {percentage >= 100
                ? "Onboarding complété !"
                : "Progression de l'onboarding"}
            </p>
            <p className="text-gray-400 text-xs md:text-sm mt-0.5 truncate">
              {watchedCount} vidéo{watchedCount > 1 ? "s" : ""} vue{watchedCount > 1 ? "s" : ""} sur {totalCount}
            </p>
          </div>
        </div>
        <span className={`text-xl md:text-2xl font-extrabold ${colors.text}`}>
          {percentage}%
        </span>
      </div>

      {/* Barre de progression */}
      <div className="relative h-3 bg-[#0F0F12] rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
        {/* Shimmer effect */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        )}
      </div>

      {/* Étapes */}
      {totalCount > 0 && totalCount <= 12 && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                i < watchedCount ? `bg-gradient-to-r ${colors.bar}` : "bg-[#2E2E38]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────
export function VideoSection() {
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => videoService.getVideos(),
    refetchOnWindowFocus: false,
  });

  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["video-progress"],
    queryFn: () => videoService.getMyProgress(),
    refetchOnWindowFocus: false,
  });

  const handlePlay = (video: VideoType) => {
    setPlayingVideo(video);
  };

  const handleClose = () => {
    setPlayingVideo(null);
    // Rafraîchir la progression après fermeture du player
    refetchProgress();
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="h-24 bg-[#1F2128] border border-[#313442] rounded-xl animate-pulse" />
        <div className="h-8 bg-[#2E2E38] rounded w-48 animate-pulse" />
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
      {/* Barre de progression en haut */}
      {progress && videos.length > 0 && (
        <VideoProgressBar progress={progress} />
      )}

      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">Vidéos d'Onboarding</h2>
        <p className="text-gray-400 text-xs md:text-sm mt-1">
          {videos.length} vidéo{videos.length > 1 ? "s" : ""} disponible{videos.length > 1 ? "s" : ""}
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#14141A] border border-dashed border-[#2E2E38] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#1E1E28] flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Aucune vidéo disponible</h3>
          <p className="text-gray-500 text-sm">Les vidéos d'onboarding seront affichées ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => {
            const isWatched = progress?.watchedVideoIds?.includes(video._id) ?? false;
            return (
              <div key={video._id} className="relative">
                {/* Badge "Vu" */}
                {isWatched && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-green-500/90 rounded-full text-white text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Vu
                  </div>
                )}
                <VideoCard
                  video={video}
                  isAdmin={false}
                  onPlay={handlePlay}
                />
              </div>
            );
          })}
        </div>
      )}

      {playingVideo && (
        <VideoPlayer video={playingVideo} onClose={handleClose} />
      )}
    </div>
  );
}