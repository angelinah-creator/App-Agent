"use client";

import { useState, useRef } from "react";
import { X, Upload, Video, Plus, Trash2, GripVertical, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videoService, Chapter } from "@/lib/video-service";

interface UploadVideoModalProps {
  onClose: () => void;
}

interface ChapterForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

function timeToSeconds(t: string): number {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + (parts[1] || 0);
}

export function UploadVideoModal({ onClose }: UploadVideoModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [chapters, setChapters] = useState<ChapterForm[]>([]);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [newChapter, setNewChapter] = useState<ChapterForm>({
    title: "", description: "", startTime: "00:00", endTime: "",
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 500 * 1024 * 1024) { alert("Max 500MB"); return; }
    if (!f.type.startsWith("video/")) { alert("Fichier vidéo uniquement"); return; }
    setFile(f);
  };

  const addChapter = () => {
    if (!newChapter.title || !newChapter.startTime) return;
    setChapters([...chapters, newChapter]);
    setNewChapter({ title: "", description: "", startTime: "00:00", endTime: "" });
    setShowChapterForm(false);
  };

  const removeChapter = (i: number) => {
    setChapters(chapters.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);

    const chaptersData: Chapter[] = chapters.map((c) => ({
      title: c.title,
      description: c.description || undefined,
      startTime: timeToSeconds(c.startTime),
      endTime: c.endTime ? timeToSeconds(c.endTime) : undefined,
    }));

    if (chaptersData.length > 0) {
      formData.append("chapters", JSON.stringify(chaptersData));
    }

    try {
      await videoService.uploadVideo(formData);
      queryClient.invalidateQueries({ queryKey: ["videos-admin"] });
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 md:p-4">
      <div className="bg-[#14141A] border border-[#2E2E38] rounded-xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#2E2E38] flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base md:text-lg">Uploader une vidéo</h2>
            <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">MP4, WebM, MOV — Max 500MB</p>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white text-sm focus:border-[#6C4EA8] focus:outline-none transition-colors"
              placeholder="Ex: Introduction à l'entreprise"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white text-sm focus:border-[#6C4EA8] focus:outline-none transition-colors h-20 resize-none"
              placeholder="Description de la vidéo..."
            />
          </div>

          {/* Fichier */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Fichier vidéo <span className="text-red-400">*</span>
            </label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-[#1E1E28] border border-[#6C4EA8]/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[#6C4EA8]/20 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-[#A78BFA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="border-2 border-dashed border-[#2E2E38] rounded-lg p-6 text-center hover:border-[#6C4EA8] transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Cliquer ou glisser-déposer</p>
                  <p className="text-gray-600 text-xs">MP4, WebM, MOV, AVI — Max 500MB</p>
                </div>
              </label>
            )}
          </div>

          {/* Chapitres */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300">
                Chapitres <span className="text-gray-500 font-normal">(optionnel)</span>
              </label>
              <button
                onClick={() => setShowChapterForm(true)}
                className="flex items-center gap-1 text-xs text-[#A78BFA] hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            {chapters.length > 0 && (
              <div className="space-y-2 mb-3">
                {chapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-[#1E1E28] border border-[#2E2E38] rounded-lg">
                    <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{ch.title}</p>
                      <p className="text-gray-500 text-[10px]">
                        {ch.startTime}{ch.endTime ? ` → ${ch.endTime}` : ""}
                      </p>
                    </div>
                    <button onClick={() => removeChapter(i)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showChapterForm && (
              <div className="p-3 bg-[#1E1E28] border border-[#2E2E38] rounded-lg space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="Titre du chapitre"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={newChapter.description}
                      onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="Description (optionnel)"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Début (mm:ss) *</label>
                    <input
                      type="text"
                      value={newChapter.startTime}
                      onChange={(e) => setNewChapter({ ...newChapter, startTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="00:00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Fin (mm:ss)</label>
                    <input
                      type="text"
                      value={newChapter.endTime}
                      onChange={(e) => setNewChapter({ ...newChapter, endTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="01:30"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={addChapter}
                    disabled={!newChapter.title || !newChapter.startTime}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Ajouter
                  </button>
                  <button
                    onClick={() => setShowChapterForm(false)}
                    className="px-3 py-1.5 bg-[#2E2E38] text-gray-400 rounded text-xs hover:bg-[#3E3E48]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[#2E2E38] flex flex-col-reverse sm:flex-row items-center sm:justify-between gap-3 sm:gap-0 flex-shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer text-center">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !file || isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Uploader la vidéo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}