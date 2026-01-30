"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaType = "image" | "video";
export type UploadPreset = "product" | "background" | "avatar";

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
  type?: MediaType;
  preset?: UploadPreset;
  currentUrl?: string;
  className?: string;
  compact?: boolean;
}

// Cloudinary unsigned upload URL
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Fallback for demo mode when Cloudinary is not configured
const DEMO_MODE = !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET;

// Max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Accepted file types
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEOS = ["video/mp4", "video/webm", "video/quicktime"];

export function MediaUploader({
  onUploadComplete,
  type = "image",
  preset = "product",
  currentUrl,
  className,
  compact = false,
}: MediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = type === "image" ? ACCEPTED_IMAGES : ACCEPTED_VIDEOS;
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Usa: ${type === "image" ? "JPG, PNG, WebP" : "MP4, WebM"}`;
    }
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return `El archivo es muy grande. Máximo: ${maxMB}MB`;
    }
    return null;
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    // Demo mode - create local blob URL
    if (DEMO_MODE) {
      return new Promise((resolve) => {
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            // Return local blob URL for demo
            const blobUrl = URL.createObjectURL(file);
            resolve(blobUrl);
          }
        }, 100);
      });
    }

    // Real Cloudinary upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);

    // Add folder based on preset
    const folder = `proyecto-tiendas/${preset}s`;
    formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error("Error al subir archivo"));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Error de conexión"));
      });

      const resourceType = type === "video" ? "video" : "image";
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
      );
      xhr.send(formData);
    });
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      setProgress(0);

      try {
        // Create preview immediately for images
        if (type === "image") {
          const localPreview = URL.createObjectURL(file);
          setPreviewUrl(localPreview);
        }

        // Upload
        const url = await uploadToCloudinary(file);
        setPreviewUrl(url);
        onUploadComplete(url);
      } catch (err) {
        setError("Error al subir el archivo. Intenta de nuevo.");
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [type, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const Icon = type === "image" ? ImageIcon : Video;

  // Compact variant (for inline use)
  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative group">
            {type === "image" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className={cn(
              "w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
              isDragOver
                ? "border-primary bg-primary/10"
                : "border-white/20 hover:border-white/40 bg-white/5"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-500">Subir</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-primary/10"
            : "border-white/20 hover:border-white/40 bg-white/5",
          isUploading && "pointer-events-none opacity-70"
        )}
      >
        {/* Preview */}
        {previewUrl && !isUploading && (
          <div className="absolute inset-2 rounded-lg overflow-hidden">
            {type === "image" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm font-medium">
                  Click para cambiar
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload UI */}
        {!previewUrl && !isUploading && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">
                {type === "image" ? "Arrastra una imagen" : "Arrastra un video"}
              </p>
              <p className="text-sm text-slate-400">
                o haz click para seleccionar
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {type === "image"
                ? "JPG, PNG, WebP · Máx. 10MB"
                : "MP4, WebM · Máx. 100MB"}
            </p>
          </div>
        )}

        {/* Uploading State */}
        {isUploading && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-white font-medium mb-2">Subiendo...</p>
              <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-2">{progress}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Demo Mode Notice */}
      {DEMO_MODE && (
        <p className="text-xs text-amber-400/70 text-center">
          Modo Demo: Las imágenes se guardan localmente (no en la nube)
        </p>
      )}
    </div>
  );
}
