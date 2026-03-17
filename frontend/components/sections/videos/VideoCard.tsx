"use client";

import { Play, Edit, Trash2, Eye, Clock, BookOpen } from "lucide-react";
import { Video } from "@/lib/video-service";

interface VideoCardProps {
  video: Video;
  isAdmin?: boolean;
  onPlay: (video: Video) => void;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

export function VideoCard({ video, isAdmin, onPlay, onEdit, onDelete }: VideoCardProps) {
  const thumbnail = video.url.replace(/\.[^/.]+$/, ".jpg");

  return (
    <div className="group relative bg-[#14141A] border border-[#2E2E38] rounded-xl overflow-hidden hover:border-[#6C4EA8] transition-all duration-300 hover:shadow-lg hover:shadow-[#6C4EA8]/10 flex flex-col">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-[#0D0D14] cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${thumbnail})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#6C4EA8]/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <Play className="w-4 h-4 md:w-6 md:h-6 text-white fill-white ml-0.5 md:ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white font-mono">
          {formatDuration(video.duration)}
        </div>

        {/* Chapters badge */}
        {video.chapters?.length > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#6C4EA8]/80 rounded text-xs text-white flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {video.chapters.length} chapitre{video.chapters.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Inactive badge */}
        {isAdmin && !video.isActive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/80 rounded text-xs text-white">
            Inactif
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3
          className="font-semibold text-white text-sm md:text-base line-clamp-2 mb-1 cursor-pointer hover:text-[#A78BFA] transition-colors"
          onClick={() => onPlay(video)}
        >
          {video.title}
        </h3>

        {video.description && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-3">{video.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {/* <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.views}
            </span> */}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(video.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
          {formatSize(video.size) && (
            <span className="text-gray-600">{formatSize(video.size)}</span>
          )}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex flex-wrap md:flex-nowrap gap-2 mt-3 pt-3 border-t border-[#2E2E38]">
            <button
              onClick={() => onPlay(video)}
              className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-1.5 bg-[#6C4EA8]/20 text-[#A78BFA] rounded hover:bg-[#6C4EA8]/40 transition-colors text-[10px] md:text-xs font-medium"
            >
              <Play className="w-3 h-3 md:w-3.5 md:h-3.5" /> Lire
            </button>
            <button
              onClick={() => onEdit?.(video)}
              className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 py-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors text-[10px] md:text-xs font-medium"
            >
              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" /> Modifier
            </button>
            <button
              onClick={() => onDelete?.(video)}
              className="flex items-center justify-center gap-1.5 px-2 md:px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-[10px] md:text-xs font-medium"
            >
              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}