"use client";

import { useState, useRef } from "react";
import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface FirebaseImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder: string; // e.g., "shops/logo" or "shops/banner"
  shopId: string;
  label?: string;
  aspectRatio?: "square" | "banner" | "auto";
  maxSizeMB?: number;
}

export function FirebaseImageUpload({
  value,
  onChange,
  folder,
  shopId,
  label = "Subir imagen",
  aspectRatio = "auto",
  maxSizeMB = 5,
}: FirebaseImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[3/1]",
    auto: "aspect-video",
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`El archivo debe ser menor a ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const filename = `${folder}/${shopId}/${timestamp}.${extension}`;
      const storageRef = ref(storage, filename);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(pct));
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Error al subir la imagen. Intenta de nuevo.");
          setUploading(false);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error al subir la imagen");
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (value && value.includes("firebasestorage.googleapis.com")) {
      try {
        const imageRef = ref(storage, value);
        await deleteObject(imageRef);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        // Preview with remove button
        <div className={`relative ${aspectClasses[aspectRatio]} w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800`}>
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-900 rounded-lg text-xs text-white transition-colors"
          >
            Cambiar
          </button>
        </div>
      ) : (
        // Upload zone
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            ${aspectClasses[aspectRatio]} w-full rounded-lg border-2 border-dashed
            ${dragOver ? "border-cyan-400 bg-cyan-400/10" : "border-zinc-700 bg-zinc-800/50"}
            ${uploading ? "cursor-wait" : "cursor-pointer hover:border-zinc-600 hover:bg-zinc-800"}
            transition-all flex flex-col items-center justify-center gap-2
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-sm text-zinc-400">Subiendo... {progress}%</span>
              <div className="w-32 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-zinc-700/50">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300">
                  Arrastra una imagen o{" "}
                  <span className="text-cyan-400">haz clic</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  PNG, JPG, WebP (máx. {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
