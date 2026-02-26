"use client";

import { useState, useEffect, useRef } from "react";
import { Video, CheckCircle, Play, Pause } from "lucide-react";
import { videoService, type Video as VideoType, type Chapter } from '@/lib/video-service';

export function VideoSection() {
  const [video, setVideo] = useState<VideoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadActiveVideo();
  }, []);

  const loadActiveVideo = async () => {
    try {
      setLoading(true);
      const activeVideo = await videoService.getActiveVideo();
      setVideo(activeVideo);
    } catch (err) {
      setError("Aucune vidéo active disponible");
      console.error("Erreur lors du chargement de la vidéo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && video) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      setCurrentTime(current);
      setProgress((current / duration) * 100);

      const updatedChapters = video.chapters.map(chapter => ({
        ...chapter,
        completed: current >= chapter.startTime
      }));
      
      if (JSON.stringify(updatedChapters) !== JSON.stringify(video.chapters)) {
        setVideo(prev => prev ? { ...prev, chapters: updatedChapters } : null);
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const calculateChapterProgress = (chapter: Chapter): number => {
    if (!videoRef.current || !video) return 0;
    
    const duration = videoRef.current.duration;
    if (currentTime >= (chapter.endTime || duration)) return 100;
    if (currentTime <= chapter.startTime) return 0;
    
    const chapterDuration = (chapter.endTime || duration) - chapter.startTime;
    const progressInChapter = currentTime - chapter.startTime;
    return (progressInChapter / chapterDuration) * 100;
  };

  const completedChapters = video?.chapters.filter(chapter => 
    currentTime >= chapter.startTime
  ).length || 0;

  const totalChapters = video?.chapters.length || 0;
  const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="animate-pulse bg-[#14141A] p-4 rounded-lg border border-[#2E2E38] h-20"></div>
        <div className="animate-pulse bg-[#14141A] p-6 rounded-lg border border-[#2E2E38] h-64"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Onboarding</h2>
          <p className="text-gray-400 text-sm">Aucune vidéo disponible</p>
        </div>
        <div className="bg-[#14141A] p-6 rounded-lg border border-[#2E2E38] text-center">
          <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{error || "Aucune vidéo uploadée"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 -mt-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Onboarding</h2>
        <p className="text-gray-400 text-sm">Complete your onboarding to get started with Code-Talent</p>
      </div>

      {/* PROGRESSION */}
      <div className="bg-[#14141A] p-4 rounded-lg border border-[#2E2E38]">
        <h2 className="text-white font-medium text-sm mb-3">
          Ta Progression
        </h2>

        <div className="w-full bg-[#262633] h-2 rounded-full overflow-hidden">
          <div
            style={{ width: `${overallProgress}%` }}
            className="h-full bg-[#6C4EA8] transition-all duration-300"
          ></div>
        </div>

        <div className="flex justify-between text-white mt-1 text-xs font-medium">
          <span>{completedChapters}/{totalChapters} chapitres</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
      </div>

      {/* VIDEO */}
      <div className="bg-[#14141A] p-6 rounded-lg border border-[#2E2E38]">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-2 bg-[#CFB7FF24] rounded-full flex items-center justify-center">
            <Video className="text-[#6C4EA8] w-8 h-8" />
          </div>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            {video.description}
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-3xl">
            <video
              ref={videoRef}
              controls
              className="rounded-lg w-full border border-[#2E2E38]"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={video.url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            
            <div className="flex items-center justify-between mt-3 px-1">
              <button
                onClick={handlePlayPause}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#6C4EA8] text-white rounded hover:bg-[#5a3d8a] transition-colors text-xs"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause' : 'Lecture'}
              </button>
              
              <div className="text-white text-xs">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / 
                {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toFixed(0).padStart(2, '0')}` : '--:--'}
              </div>
            </div>
          </div>
        </div>

        {progress >= 99 && (
          <div className="mt-4 text-center">
            <span className="text-[#71D296] text-xs bg-[#9AFFB524] px-3 py-1.5 rounded">
              Félicitations, visionnage terminé
            </span>
          </div>
        )}
      </div>

      {/* CHAPTER LIST */}
      {video.chapters && video.chapters.length > 0 && (
        <div className="bg-[#14141A] p-6 rounded-lg border border-[#2E2E38]">
          <h2 className="text-white text-base font-medium mb-4">
            Liste des chapitres
          </h2>

          <div className="flex flex-col gap-3">
            {video.chapters.map((chapter, index) => {
              const isCompleted = currentTime >= chapter.startTime;
              const chapterProgress = calculateChapterProgress(chapter);
              
              return (
                <div
                  key={index}
                  className={`border border-[#2E2E38] p-3 rounded-lg flex gap-3 items-start cursor-pointer hover:border-[#6C4EA8] transition-colors ${
                    isCompleted ? 'bg-[#9AFFB524]' : 'bg-[#1E1E28]'
                  }`}
                  onClick={() => seekToTime(chapter.startTime)}
                >
                  <CheckCircle 
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isCompleted ? 'text-green-400' : 'text-gray-400'
                    }`} 
                  />

                  <div className="flex-1">
                    <h3 className={`font-medium text-sm ${
                      isCompleted ? 'text-[#71D296]' : 'text-white'
                    }`}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-1.5">{chapter.description}</p>
                    
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}