"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { uploadPhoto } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import type { Photo } from "@/types";

interface PhotoUploaderProps {
  entityType: Photo["entityType"];
  entityId: string;
  existingPhotoUrls?: string[];
  onUploaded?: (photo: Photo) => void;
  compact?: boolean;
}

export function PhotoUploader({
  entityType,
  entityId,
  existingPhotoUrls = [],
  onUploaded,
  compact = false,
}: PhotoUploaderProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }
    setError(null);
    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const photo = await uploadPhoto(file, user.uid, entityType, entityId);
      onUploaded?.(photo);
      setPreview(null);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (compact) {
    return (
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          {uploading ? "Uploading..." : "Add Photo"}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Existing photos */}
      {existingPhotoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingPhotoUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full aspect-video object-cover rounded-xl" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
        >
          <div className="bg-blue-50 rounded-full p-3">
            <Camera className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Take or upload photo</p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG up to 10MB</p>
          </div>
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
