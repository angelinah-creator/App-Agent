"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { videoService, Video as VideoType } from "@/lib/video-service";
import { VideoCard } from "./videos/VideoCard";
import { VideoPlayer } from "./videos/VideoPlayer";

export function VideoSection() {
  const [playingVideo, setPlayingVideo] = useState<VideoType | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => videoService.getVideos(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6">
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
      <div>
        <h2 className="text-2xl font-extrabold text-white">Vidéos d'Onboarding</h2>
        <p className="text-gray-400 text-sm mt-1">
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
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              isAdmin={false}
              onPlay={setPlayingVideo}
            />
          ))}
        </div>
      )}

      {playingVideo && (
        <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}