"use client";

import type React from "react";
import { useState, useRef } from "react";
import { X, Camera, Trash2 } from "lucide-react";
import type { Agent } from "@/lib/users-service";
import { usersService } from "@/lib/users-service";
import type { PhotoUploadModalProps } from "../types";
import { getInitials, getAvatarColor } from "../utils";

// Composant Button local
function Btn({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: string;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizes: Record<string, string> = {
    sm: "px-2.5 py-1 text-xs h-7",
    md: "px-3.5 py-2 text-sm h-9",
  };

  const variants: Record<string, string> = {
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500",
    outline:
      "border border-[#3a3d4e] hover:border-violet-500 text-gray-300 hover:text-white bg-transparent focus:ring-violet-500",
    ghost:
      "text-gray-400 hover:text-white hover:bg-white/10 bg-transparent focus:ring-white/20",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    orange:
      "border border-orange-500/40 hover:bg-orange-600 hover:border-orange-600 text-orange-400 hover:text-white focus:ring-orange-500",
    green:
      "border border-green-500/40 hover:bg-green-600 hover:border-green-600 text-green-400 hover:text-white focus:ring-green-500",
    blue: "border border-blue-500/40 hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PhotoUploadModal({
  agent,
  onClose,
  onSuccess,
}: PhotoUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(
    (agent as any).profilePhoto?.url || null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await usersService.uploadProfilePhoto(agent._id, file);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await usersService.deleteProfilePhoto(agent._id);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1c26] border border-[#2e3144] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2e3144]">
          <h3 className="text-sm font-semibold text-white">Photo de profil</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-[#3a3d4e] flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                backgroundColor: preview ? undefined : getAvatarColor(agent),
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-white">
                  <span className="text-3xl font-bold">
                    {getInitials(agent)}
                  </span>
                  <Camera size={16} className="opacity-60" />
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Cliquez ou glissez une image pour changer la photo
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {(agent as any).profilePhoto?.url && (
              <Btn
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                <Trash2 size={13} />
                Supprimer
              </Btn>
            )}
            <Btn
              variant="primary"
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1"
            >
              {loading ? "Upload..." : "Enregistrer"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
