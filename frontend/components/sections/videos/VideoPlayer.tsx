"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle, Circle, Play, Pause, Volume2, VolumeX, Maximize, BookOpen } from "lucide-react";
import { Video, Chapter, videoService } from "@/lib/video-service";

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getActiveChapterIndex(chapters: Chapter[], currentTime: number): number {
  if (!chapters?.length) return -1;
  let active = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (currentTime >= chapters[i].startTime) active = i;
  }
  return active;
}

function getChapterProgress(chapter: Chapter, currentTime: number, videoDuration: number): number {
  const end = chapter.endTime ?? videoDuration;
  if (currentTime <= chapter.startTime) return 0;
  if (currentTime >= end) return 100;
  return ((currentTime - chapter.startTime) / (end - chapter.startTime)) * 100;
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [viewCounted, setViewCounted] = useState(false);
  const [showChapters, setShowChapters] = useState(true);

  const chapters = video.chapters || [];
  const activeChapterIndex = getActiveChapterIndex(chapters, currentTime);
  const overallProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = () => {
      setCurrentTime(el.currentTime);
      // Count view after 30s or 10% of video
      if (!viewCounted && (el.currentTime > 30 || (duration > 0 && el.currentTime / duration > 0.1))) {
        setViewCounted(true);
        videoService.incrementViews(video._id).catch(() => {});
      }
    };
    const onDuration = () => setDuration(el.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [video._id, duration, viewCounted]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") togglePlay();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    isPlaying ? el.pause() : el.play();
  };

  const seekToChapter = (chapter: Chapter) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = chapter.startTime;
    el.play();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    const bar = progressRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      setIsMuted(v === 0);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const toggleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#2E2E38] bg-[#0D0D14] flex-shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          <h2 className="text-white font-bold text-base md:text-lg truncate">{video.title}</h2>
          {video.description && (
            <p className="text-gray-400 text-xs truncate hidden sm:block">{video.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {chapters.length > 0 && (
            <button
              onClick={() => setShowChapters(!showChapters)}
              className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showChapters
                  ? "bg-[#6C4EA8] text-white"
                  : "bg-[#1E1E28] text-gray-400 hover:text-white border border-[#2E2E38]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chapitres ({chapters.length})</span>
              <span className="sm:hidden">({chapters.length})</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar global */}
      <div className="px-6 py-2 bg-[#0D0D14] flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-1.5">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 flex gap-1">
            {chapters.length > 0 ? (
              chapters.map((ch, i) => {
                const end = ch.endTime ?? duration;
                const widthPct = duration > 0 ? ((end - ch.startTime) / duration) * 100 : 100 / chapters.length;
                const prog = getChapterProgress(ch, currentTime, duration);
                return (
                  <div
                    key={i}
                    className="relative flex-1 h-2 bg-[#2E2E38] rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                    style={{ flexBasis: `${widthPct}%` }}
                    onClick={() => seekToChapter(ch)}
                    title={ch.title}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-[#6C4EA8] transition-all duration-150"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                );
              })
            ) : (
              <div
                ref={progressRef}
                className="flex-1 h-2 bg-[#2E2E38] rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-[#6C4EA8] transition-all duration-150"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            )}
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Video */}
        <div className={`flex flex-col flex-1 overflow-hidden ${showChapters && chapters.length > 0 ? "md:border-r border-[#2E2E38]" : ""}`}>
          {/* Video player */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className="max-h-full max-w-full"
              style={{ aspectRatio: "16/9", maxHeight: "100%", objectFit: "contain" }}
              onClick={togglePlay}
            >
              <source src={video.url} type="video/mp4" />
            </video>
          </div>

          {/* Controls */}
          <div className="bg-[#0D0D14] border-t border-[#2E2E38] px-3 md:px-6 py-3 flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={togglePlay}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#6C4EA8] flex items-center justify-center hover:bg-[#5a3d8a] transition-colors flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              )}
            </button>

            {/* Chapter navigation */}
            {chapters.length > 0 && (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    const prev = chapters[activeChapterIndex - 1];
                    if (prev) seekToChapter(prev);
                  }}
                  disabled={activeChapterIndex <= 0}
                  className="p-1 md:p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <span className="text-[10px] md:text-xs text-gray-400 hidden sm:block max-w-[100px] md:max-w-[200px] truncate">
                  {activeChapterIndex >= 0 ? chapters[activeChapterIndex]?.title : ""}
                </span>
                <button
                  onClick={() => {
                    const next = chapters[activeChapterIndex + 1];
                    if (next) seekToChapter(next);
                  }}
                  disabled={activeChapterIndex >= chapters.length - 1}
                  className="p-1 md:p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            )}

            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={toggleMute} className="p-1 md:p-2 text-gray-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 md:w-20 accent-[#6C4EA8]"
              />
            </div>

            <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white transition-colors p-1 md:p-2 ml-1 md:ml-2">
              <Maximize className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Chapters sidebar */}
        {showChapters && chapters.length > 0 && (
          <div className="w-full md:w-80 h-1/3 md:h-auto flex flex-col bg-[#0D0D14] overflow-hidden flex-shrink-0 border-t md:border-t-0 border-[#2E2E38]">
            <div className="px-4 py-3 border-b border-[#2E2E38] flex-shrink-0 flex items-center justify-between md:block">
              <div>
                <h3 className="text-white font-semibold text-sm">Chapitres</h3>
                <p className="text-gray-500 text-xs mt-0.5">{chapters.length} section{chapters.length > 1 ? "s" : ""}</p>
              </div>
              <button 
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setShowChapters(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chapters.map((chapter, index) => {
                const isActive = index === activeChapterIndex;
                const isCompleted = currentTime >= (chapter.endTime ?? (chapters[index + 1]?.startTime ?? duration));
                const prog = getChapterProgress(chapter, currentTime, duration);

                return (
                  <div
                    key={index}
                    onClick={() => seekToChapter(chapter)}
                    className={`px-4 py-3 cursor-pointer border-b border-[#1E1E28] transition-colors ${
                      isActive
                        ? "bg-[#6C4EA8]/15 border-l-2 border-l-[#6C4EA8]"
                        : "hover:bg-[#1E1E28]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className={`w-5 h-5 ${isActive ? "text-[#A78BFA]" : "text-gray-600"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? "text-[#A78BFA]" : isCompleted ? "text-green-400" : "text-white"
                        }`}>
                          {chapter.title}
                        </p>
                        {chapter.description && (
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{chapter.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-[#2E2E38] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6C4EA8] transition-all duration-300"
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {formatTime(chapter.startTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}