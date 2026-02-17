"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Link, Instagram, ExternalLink, Loader2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface InspirationUploadProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
    shopId: string;
}

export function InspirationUpload({
    images,
    onImagesChange,
    maxImages = 5,
    shopId,
}: InspirationUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [linkInput, setLinkInput] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = maxImages - images.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        try {
            for (const file of filesToUpload) {
                // Validate file
                if (!file.type.startsWith("image/")) continue;
                if (file.size > 5 * 1024 * 1024) continue; // 5MB limit

                // Upload to Firebase Storage
                const fileName = `consultations/${shopId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedUrls.push(url);
            }

            if (uploadedUrls.length > 0) {
                onImagesChange([...images, ...uploadedUrls]);
            }
        } catch (error) {
            console.error("Error uploading images:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleAddLink = () => {
        if (!linkInput.trim()) return;

        // Basic URL validation
        try {
            new URL(linkInput);
            if (images.length < maxImages) {
                onImagesChange([...images, linkInput.trim()]);
                setLinkInput("");
                setShowLinkInput(false);
            }
        } catch {
            // Invalid URL
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white">
                    Fotos de inspiración
                </label>
                <span className="text-xs text-slate-500">
                    {images.length}/{maxImages}
                </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
                Sube fotos de looks que te gusten para que la maquillista sepa qué tienes en mente
            </p>

            {/* Uploaded Images Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                    {images.map((url, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-xl overflow-hidden group"
                        >
                            <img
                                src={url}
                                alt={`Inspiración ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Options */}
            {images.length < maxImages && (
                <div className="space-y-3">
                    {/* File Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer
                            ${isUploading
                                ? "border-pink-500/50 bg-pink-500/10"
                                : "border-white/20 hover:border-pink-500/50 hover:bg-pink-500/5"
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center text-center">
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-2" />
                                    <p className="text-sm text-pink-300">Subiendo...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-white font-medium mb-1">
                                        Arrastra fotos aquí o haz clic
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        JPG, PNG • Máximo 5MB
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Link Input Toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            <Link className="w-4 h-4" />
                            Agregar link de imagen
                        </button>
                    </div>

                    {/* Link Input */}
                    {showLinkInput && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <input
                                type="url"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddLink}
                                className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors"
                            >
                                Agregar
                            </button>
                        </div>
                    )}

                    {/* Quick Tips */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-slate-400 mb-2">Tips para elegir fotos:</p>
                        <ul className="text-xs text-slate-500 space-y-1">
                            <li className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-pink-500" />
                                Busca fotos con iluminación similar a tu evento
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-pink-500" />
                                Intenta encontrar modelos con tono de piel similar
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-pink-500" />
                                Puedes buscar en Pinterest o Instagram
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

// Social Links Component
interface SocialLinksInputProps {
    pinterestLinks: string[];
    instagramLinks: string[];
    onPinterestChange: (links: string[]) => void;
    onInstagramChange: (links: string[]) => void;
}

export function SocialLinksInput({
    pinterestLinks,
    instagramLinks,
    onPinterestChange,
    onInstagramChange,
}: SocialLinksInputProps) {
    const [pinterestInput, setPinterestInput] = useState("");
    const [instagramInput, setInstagramInput] = useState("");

    const addPinterestLink = () => {
        if (pinterestInput.trim() && pinterestLinks.length < 3) {
            onPinterestChange([...pinterestLinks, pinterestInput.trim()]);
            setPinterestInput("");
        }
    };

    const addInstagramLink = () => {
        if (instagramInput.trim() && instagramLinks.length < 3) {
            onInstagramChange([...instagramLinks, instagramInput.trim()]);
            setInstagramInput("");
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">
                ¿Tienes links de inspiración? (opcional)
            </p>

            {/* Pinterest */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <span className="text-sm text-slate-300">Pinterest</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={pinterestInput}
                        onChange={(e) => setPinterestInput(e.target.value)}
                        placeholder="https://pinterest.com/pin/..."
                        className="flex-1 px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                    <button
                        type="button"
                        onClick={addPinterestLink}
                        disabled={pinterestLinks.length >= 3}
                        className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        +
                    </button>
                </div>
                {pinterestLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {pinterestLinks.map((link, i) => (
                            <span key={i} className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Pin {i + 1}
                                <button type="button" onClick={() => onPinterestChange(pinterestLinks.filter((_, idx) => idx !== i))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Instagram */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <span className="text-sm text-slate-300">Instagram</span>
                </div>
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={instagramInput}
                        onChange={(e) => setInstagramInput(e.target.value)}
                        placeholder="https://instagram.com/p/..."
                        className="flex-1 px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                    <button
                        type="button"
                        onClick={addInstagramLink}
                        disabled={instagramLinks.length >= 3}
                        className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        +
                    </button>
                </div>
                {instagramLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {instagramLinks.map((link, i) => (
                            <span key={i} className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Post {i + 1}
                                <button type="button" onClick={() => onInstagramChange(instagramLinks.filter((_, idx) => idx !== i))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
