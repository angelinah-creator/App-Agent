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

      // Marquer les chapitres comme complétés si on les a dépassés
      const updatedChapters = video.chapters.map(chapter => ({
        ...chapter,
        completed: current >= chapter.startTime
      }));
      
      // Mettre à jour l'état si nécessaire
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
      <div className="w-full flex flex-col gap-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse bg-[#14141A] p-6 rounded-xl border border-[#2E2E38] h-32"></div>
        <div className="animate-pulse bg-[#14141A] p-10 rounded-xl border border-[#2E2E38] h-96"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full flex flex-col gap-10">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Onboarding</h2>
          <p className="text-gray-400">Aucune vidéo disponible pour le moment</p>
        </div>
        <div className="bg-[#14141A] p-10 rounded-xl border border-[#2E2E38] text-center">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{error || "Aucune vidéo n'a été uploadée"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-10">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Onboarding</h2>
        <p className="text-gray-400">Complete your onboarding to get started with Code-Talent</p>
      </div>

      {/* ---- PROGRESSION ---- */}
      <div className="bg-[#14141A] p-6 rounded-xl border border-[#2E2E38]">
        <h2 className="text-white font-semibold text-lg mb-4">
          Ta Progression
        </h2>

        <div className="w-full bg-[#262633] h-3 rounded-full overflow-hidden">
          <div
            style={{ width: `${overallProgress}%` }}
            className="h-full bg-[#6C4EA8] transition-all duration-300"
          ></div>
        </div>

        <div className="flex justify-between text-white mt-1 text-sm font-medium">
          <span>{completedChapters} sur {totalChapters} chapitres complétés</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
      </div>

      {/* ---- VIDEO ---- */}
      <div className="bg-[#14141A] p-10 rounded-xl border border-[#2E2E38]">
        <div className="text-center mb-6">
          <div className="w-28 h-28 mx-auto mb-3 bg-[#CFB7FF24] rounded-full flex items-center justify-center">
            <Video className="text-[#6C4EA8] w-14 h-14" />
          </div>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            {video.description}
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-4xl">
            <video
              ref={videoRef}
              controls
              className="rounded-xl w-full border border-[#2E2E38]"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={video.url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            
            {/* Contrôles personnalisés */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={handlePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Lecture'}
              </button>
              
              <div className="text-white text-sm">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / 
                {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toFixed(0).padStart(2, '0')}` : '--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Message final */}
        {progress >= 99 && (
          <div className="mt-5 text-center">
            <span className="text-[#71D296] text-sm bg-[#9AFFB524] px-4 py-2 rounded-lg">
              Félicitations, vous avez visionné la vidéo jusqu'à la fin
            </span>
          </div>
        )}
      </div>

      {/* ---- CHAPTER LIST ---- */}
      {video.chapters && video.chapters.length > 0 && (
        <div className="bg-[#14141A] p-10 rounded-xl border border-[#2E2E38]">
          <h2 className="text-white text-xl font-semibold mb-6">
            Liste des chapitres dans la vidéo
          </h2>

          <div className="flex flex-col gap-4">
            {video.chapters.map((chapter, index) => {
              const isCompleted = currentTime >= chapter.startTime;
              const chapterProgress = calculateChapterProgress(chapter);
              
              return (
                <div
                  key={index}
                  className={`border border-[#2E2E38] p-5 rounded-xl flex gap-4 items-start cursor-pointer hover:border-[#6C4EA8] transition-colors ${
                    isCompleted ? 'bg-[#9AFFB524]' : 'bg-[#1E1E28]'
                  }`}
                  onClick={() => seekToTime(chapter.startTime)}
                >
                  <CheckCircle 
                    className={`w-6 h-6 flex-shrink-0 ${
                      isCompleted ? 'text-green-400' : 'text-gray-400'
                    }`} 
                  />

                  <div className="flex-1">
                    <h3 className={`font-bold text-xl ${
                      isCompleted ? 'text-[#71D296]' : 'text-white'
                    }`}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{chapter.description}</p>
                    
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}