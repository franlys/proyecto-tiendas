"use client";

import { useState, useRef, useEffect } from "react";
import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from "firebase/storage";
import { X, Loader2, ImageIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";

interface FirebaseImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder: string;
  shopId: string;
  label?: string;
  aspectRatio?: "square" | "banner" | "auto";
  maxSizeMB?: number;
  accept?: "image" | "video" | "both";
}

export function FirebaseImageUpload({
  value,
  onChange,
  folder,
  shopId,
  label = "Subir archivo",
  aspectRatio = "auto",
  maxSizeMB = 10,
  accept = "image",
}: FirebaseImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stuckWarning, setStuckWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const lastProgressRef = useRef<number>(0);
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[3/1]",
    auto: "aspect-video",
  };

  const isVideo = (url: string) => {
    return url.includes(".mp4") || url.includes(".webm") || url.includes(".mov");
  };

  // Check if upload is stuck (no progress for 10 seconds)
  useEffect(() => {
    if (uploading && progress > 0) {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }

      if (progress === lastProgressRef.current && progress < 100) {
        stuckTimerRef.current = setTimeout(() => {
          setStuckWarning(true);
        }, 10000);
      } else {
        setStuckWarning(false);
      }

      lastProgressRef.current = progress;
    }

    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }
    };
  }, [uploading, progress]);

  const handleCancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    setStuckWarning(false);
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setStuckWarning(false);

    // Check if storage is initialized
    if (!storage) {
      setError("Firebase Storage no está configurado. Contacta al administrador.");
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideoFile = file.type.startsWith("video/");

    if (accept === "image" && !isImage) {
      setError("Solo se permiten imágenes");
      return;
    }
    if (accept === "video" && !isVideoFile) {
      setError("Solo se permiten videos");
      return;
    }
    if (accept === "both" && !isImage && !isVideoFile) {
      setError("Solo se permiten imágenes o videos");
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
    lastProgressRef.current = 0;

    try {
      // Create unique filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const filename = `${folder}/${shopId}/${timestamp}.${extension}`;

      console.log("Starting upload to:", filename);

      const storageRef = ref(storage, filename);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTaskRef.current = uploadTask;

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(pct));
        },
        (error) => {
          console.error("Upload error details:", error);
          setError("Error al subir el archivo.");
          setUploading(false);
          setStuckWarning(false);
          uploadTaskRef.current = null;
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onChange(downloadURL);
            setUploading(false);
            setProgress(0);
            setStuckWarning(false);
            uploadTaskRef.current = null;
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            setError("Error al obtener URL.");
            setUploading(false);
            uploadTaskRef.current = null;
          }
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error al iniciar la subida.");
      setUploading(false);
      uploadTaskRef.current = null;
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
        console.error("Error deleting file:", err);
      }
    }
    onChange("");
  };

  const renderPreview = () => {
    if (!value) return null;

    if (isVideo(value)) {
      return (
        <video
          src={value}
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          loop
        />
      );
    }

    return (
      <Image
        src={value}
        alt="Preview"
        fill
        className="object-cover"
        unoptimized
      />
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept === "video" ? "video/*" : accept === "both" ? "image/*,video/*" : "image/*"}
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        // Preview with remove button
        <div className={`relative ${aspectClasses[aspectRatio]} w-full rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800`}>
          {renderPreview()}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-900 rounded-lg text-xs text-white transition-colors z-10"
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
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-sm text-zinc-400">Subiendo... {progress}%</span>
              <div className="w-32 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {stuckWarning && (
                <div className="flex items-center gap-2 text-amber-400 text-xs mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>La subida parece atorada</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelUpload();
                }}
                className="mt-2 px-3 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-zinc-700/50">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300">
                  Arrastra un archivo o{" "}
                  <span className="text-cyan-400">haz clic</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {accept === "video" ? "MP4, WEBM" : accept === "both" ? "Imágenes o Video" : "PNG, JPG, WebP"} (máx. {maxSizeMB}MB)
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
