"use client";

import { useState } from "react";
import { X, Check, Plus, Trash2, GripVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videoService, Video, Chapter, UpdateVideoData } from "@/lib/video-service";

interface EditVideoModalProps {
  video: Video;
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

function secondsToTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function EditVideoModal({ video, onClose }: EditVideoModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || "");
  const [chapters, setChapters] = useState<ChapterForm[]>(
    video.chapters.map((c) => ({
      title: c.title,
      description: c.description || "",
      startTime: secondsToTime(c.startTime),
      endTime: c.endTime ? secondsToTime(c.endTime) : "",
    }))
  );
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newChapter, setNewChapter] = useState<ChapterForm>({
    title: "", description: "", startTime: "00:00", endTime: "",
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateVideoData) => videoService.updateVideo(video._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos-admin"] });
      onClose();
    },
    onError: (err: any) => alert(err?.response?.data?.message || "Erreur"),
  });

  const handleSave = () => {
    const chaptersData: Chapter[] = chapters.map((c) => ({
      title: c.title,
      description: c.description || undefined,
      startTime: timeToSeconds(c.startTime),
      endTime: c.endTime ? timeToSeconds(c.endTime) : undefined,
    }));

    mutation.mutate({ title, description: description || undefined, chapters: chaptersData });
  };

  const addChapter = () => {
    if (!newChapter.title) return;
    if (editingIndex !== null) {
      const updated = [...chapters];
      updated[editingIndex] = newChapter;
      setChapters(updated);
      setEditingIndex(null);
    } else {
      setChapters([...chapters, newChapter]);
    }
    setNewChapter({ title: "", description: "", startTime: "00:00", endTime: "" });
    setShowAddChapter(false);
  };

  const startEdit = (i: number) => {
    setNewChapter(chapters[i]);
    setEditingIndex(i);
    setShowAddChapter(true);
  };

  const removeChapter = (i: number) => setChapters(chapters.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#14141A] border border-[#2E2E38] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E38] flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Modifier la vidéo</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white text-sm focus:border-[#6C4EA8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#1E1E28] border border-[#2E2E38] rounded-lg text-white text-sm focus:border-[#6C4EA8] focus:outline-none h-20 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300">
                Chapitres <span className="text-gray-500 font-normal">({chapters.length})</span>
              </label>
              <button
                onClick={() => { setEditingIndex(null); setNewChapter({ title: "", description: "", startTime: "00:00", endTime: "" }); setShowAddChapter(true); }}
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
                    <button onClick={() => startEdit(i)} className="text-blue-400 hover:text-blue-300 p-1 text-xs">
                      Éditer
                    </button>
                    <button onClick={() => removeChapter(i)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddChapter && (
              <div className="p-3 bg-[#1E1E28] border border-[#2E2E38] rounded-lg space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={newChapter.description}
                      onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Début *</label>
                    <input
                      type="text"
                      value={newChapter.startTime}
                      onChange={(e) => setNewChapter({ ...newChapter, startTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="00:00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Fin</label>
                    <input
                      type="text"
                      value={newChapter.endTime}
                      onChange={(e) => setNewChapter({ ...newChapter, endTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#262633] border border-[#2E2E38] rounded text-white text-xs focus:border-[#6C4EA8] focus:outline-none"
                      placeholder="01:30"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addChapter}
                    disabled={!newChapter.title}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> {editingIndex !== null ? "Modifier" : "Ajouter"}
                  </button>
                  <button onClick={() => setShowAddChapter(false)} className="px-3 py-1.5 bg-[#2E2E38] text-gray-400 rounded text-xs">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#2E2E38] flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d8a] text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
            ) : (
              <><Check className="w-4 h-4" /> Sauvegarder</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}