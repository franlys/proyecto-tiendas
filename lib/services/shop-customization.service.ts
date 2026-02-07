/**
 * Servicio de Personalización de Tienda
 *
 * Gestiona la configuración visual, enlaces y media de cada tienda.
 */

import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import type { FirestoreShop } from "@/types/shop.types";
import type {
    ShopMedia,
    ShopLinks,
    ShopBranding,
    MediaFile,
    SocialLinks,
    ContactLinks,
    PaymentLinks,
    CustomLink,
} from "@/lib/types/shop-customization.types";
import {
    DEFAULT_MEDIA,
    DEFAULT_LINKS,
    DEFAULT_BRANDING,
    normalizeSocialUrl,
    isValidUrl,
} from "@/lib/types/shop-customization.types";

const COLLECTION = "shops";

// ============================================
// MEDIA (Archivos)
// ============================================

/**
 * Subir un archivo de media para la tienda
 */
export async function uploadShopMedia(
    shopId: string,
    file: File,
    mediaType: keyof Omit<ShopMedia, "gallery">
): Promise<MediaFile> {
    const timestamp = Date.now();
    const filename = `${mediaType}_${timestamp}_${file.name}`;
    const path = `shops/${shopId}/media/${filename}`;
    const storageRef = ref(storage, path);

    // Subir archivo
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const mediaFile: MediaFile = {
        url,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path,
    };

    // Actualizar en Firestore
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentMedia = data.media || DEFAULT_MEDIA;

    await updateDoc(docRef, {
        media: {
            ...currentMedia,
            [mediaType]: mediaFile,
        },
        updatedAt: serverTimestamp(),
    });

    return mediaFile;
}

/**
 * Subir una imagen a la galería
 */
export async function addToGallery(
    shopId: string,
    file: File
): Promise<MediaFile> {
    const timestamp = Date.now();
    const filename = `gallery_${timestamp}_${file.name}`;
    const path = `shops/${shopId}/gallery/${filename}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const mediaFile: MediaFile = {
        url,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path,
    };

    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentMedia = data.media || DEFAULT_MEDIA;
    const currentGallery = currentMedia.gallery || [];

    await updateDoc(docRef, {
        media: {
            ...currentMedia,
            gallery: [...currentGallery, mediaFile],
        },
        updatedAt: serverTimestamp(),
    });

    return mediaFile;
}

/**
 * Eliminar un archivo de media
 */
export async function deleteShopMedia(
    shopId: string,
    mediaType: keyof Omit<ShopMedia, "gallery">
): Promise<void> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentMedia = data.media || DEFAULT_MEDIA;
    const file = currentMedia[mediaType] as MediaFile | undefined;

    if (file?.path) {
        try {
            const storageRef = ref(storage, file.path);
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Error deleting file from storage:", error);
        }
    }

    const updatedMedia = { ...currentMedia };
    delete updatedMedia[mediaType];

    await updateDoc(docRef, {
        media: updatedMedia,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Eliminar imagen de la galería
 */
export async function removeFromGallery(
    shopId: string,
    imagePath: string
): Promise<void> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentMedia = data.media || DEFAULT_MEDIA;
    const currentGallery = currentMedia.gallery || [];

    // Eliminar del storage
    try {
        const storageRef = ref(storage, imagePath);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting file from storage:", error);
    }

    // Actualizar galería
    const updatedGallery = currentGallery.filter((img) => img.path !== imagePath);

    await updateDoc(docRef, {
        media: {
            ...currentMedia,
            gallery: updatedGallery,
        },
        updatedAt: serverTimestamp(),
    });
}

/**
 * Obtener toda la media de una tienda
 */
export async function getShopMedia(shopId: string): Promise<ShopMedia> {
    const docRef = doc(db, COLLECTION, shopId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = snapshot.data() as FirestoreShop;
    return data.media || DEFAULT_MEDIA;
}

// ============================================
// LINKS (Enlaces)
// ============================================

/**
 * Actualizar enlaces sociales
 */
export async function updateSocialLinks(
    shopId: string,
    social: Partial<SocialLinks>
): Promise<ShopLinks> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;

    // Normalizar URLs de redes sociales
    const normalizedSocial: Partial<SocialLinks> = {};
    for (const [key, value] of Object.entries(social)) {
        if (value) {
            normalizedSocial[key as keyof SocialLinks] = normalizeSocialUrl(
                key as keyof SocialLinks,
                value
            );
        }
    }

    const updatedLinks: ShopLinks = {
        ...currentLinks,
        social: {
            ...currentLinks.social,
            ...normalizedSocial,
        },
    };

    await updateDoc(docRef, {
        links: updatedLinks,
        updatedAt: serverTimestamp(),
    });

    return updatedLinks;
}

/**
 * Actualizar enlaces de contacto
 */
export async function updateContactLinks(
    shopId: string,
    contact: Partial<ContactLinks>
): Promise<ShopLinks> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;

    const updatedLinks: ShopLinks = {
        ...currentLinks,
        contact: {
            ...currentLinks.contact,
            ...contact,
        },
    };

    await updateDoc(docRef, {
        links: updatedLinks,
        updatedAt: serverTimestamp(),
    });

    return updatedLinks;
}

/**
 * Actualizar enlaces de pago
 */
export async function updatePaymentLinks(
    shopId: string,
    payment: Partial<PaymentLinks>
): Promise<ShopLinks> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;

    const updatedLinks: ShopLinks = {
        ...currentLinks,
        payment: {
            ...currentLinks.payment,
            ...payment,
        },
    };

    await updateDoc(docRef, {
        links: updatedLinks,
        updatedAt: serverTimestamp(),
    });

    return updatedLinks;
}

/**
 * Agregar enlace personalizado
 */
export async function addCustomLink(
    shopId: string,
    link: Omit<CustomLink, "id">
): Promise<CustomLink> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;
    const customLinks = currentLinks.custom || [];

    const newLink: CustomLink = {
        ...link,
        id: `link_${Date.now()}`,
    };

    await updateDoc(docRef, {
        links: {
            ...currentLinks,
            custom: [...customLinks, newLink],
        },
        updatedAt: serverTimestamp(),
    });

    return newLink;
}

/**
 * Actualizar enlace personalizado
 */
export async function updateCustomLink(
    shopId: string,
    linkId: string,
    updates: Partial<Omit<CustomLink, "id">>
): Promise<CustomLink | null> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;
    const customLinks = currentLinks.custom || [];

    const linkIndex = customLinks.findIndex((l) => l.id === linkId);
    if (linkIndex === -1) return null;

    const updatedLink = {
        ...customLinks[linkIndex],
        ...updates,
    };

    customLinks[linkIndex] = updatedLink;

    await updateDoc(docRef, {
        links: {
            ...currentLinks,
            custom: customLinks,
        },
        updatedAt: serverTimestamp(),
    });

    return updatedLink;
}

/**
 * Eliminar enlace personalizado
 */
export async function deleteCustomLink(
    shopId: string,
    linkId: string
): Promise<void> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentLinks = data.links || DEFAULT_LINKS;
    const customLinks = (currentLinks.custom || []).filter(
        (l) => l.id !== linkId
    );

    await updateDoc(docRef, {
        links: {
            ...currentLinks,
            custom: customLinks,
        },
        updatedAt: serverTimestamp(),
    });
}

/**
 * Obtener todos los enlaces de una tienda
 */
export async function getShopLinks(shopId: string): Promise<ShopLinks> {
    const docRef = doc(db, COLLECTION, shopId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = snapshot.data() as FirestoreShop;
    return data.links || DEFAULT_LINKS;
}

// ============================================
// BRANDING (Tema y Diseño)
// ============================================

/**
 * Actualizar branding completo
 */
export async function updateShopBranding(
    shopId: string,
    branding: Partial<ShopBranding>
): Promise<ShopBranding> {
    const docRef = doc(db, COLLECTION, shopId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = existing.data() as FirestoreShop;
    const currentBranding = data.branding || DEFAULT_BRANDING;

    const updatedBranding: ShopBranding = {
        ...currentBranding,
        ...branding,
        theme: branding.theme
            ? { ...currentBranding.theme, ...branding.theme }
            : currentBranding.theme,
        layout: branding.layout
            ? { ...currentBranding.layout, ...branding.layout }
            : currentBranding.layout,
    };

    await updateDoc(docRef, {
        branding: updatedBranding,
        updatedAt: serverTimestamp(),
    });

    return updatedBranding;
}

/**
 * Obtener branding de una tienda
 */
export async function getShopBranding(shopId: string): Promise<ShopBranding> {
    const docRef = doc(db, COLLECTION, shopId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = snapshot.data() as FirestoreShop;
    return data.branding || DEFAULT_BRANDING;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener toda la personalización de una tienda
 */
export async function getFullCustomization(shopId: string): Promise<{
    media: ShopMedia;
    links: ShopLinks;
    branding: ShopBranding;
}> {
    const docRef = doc(db, COLLECTION, shopId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        throw new Error("Tienda no encontrada");
    }

    const data = snapshot.data() as FirestoreShop;

    return {
        media: data.media || DEFAULT_MEDIA,
        links: data.links || DEFAULT_LINKS,
        branding: data.branding || DEFAULT_BRANDING,
    };
}
