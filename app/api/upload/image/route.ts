import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const shopId = formData.get("shopId") as string;
        const orderId = formData.get("orderId") as string;
        const type = formData.get("type") as string || "general";

        if (!file) {
            return NextResponse.json(
                { error: "No se proporcionó ningún archivo" },
                { status: 400 }
            );
        }

        if (!shopId) {
            return NextResponse.json(
                { error: "Se requiere el ID de la tienda" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "El archivo debe ser una imagen" },
                { status: 400 }
            );
        }

        // Validate file size (max 20MB — allows 4K quality images)
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: "La imagen debe ser menor a 20MB" },
                { status: 400 }
            );
        }

        // Initialize Firebase Admin
        const app = initAdmin();
        if (!app) {
            return NextResponse.json(
                { error: "Error de conexión al storage" },
                { status: 500 }
            );
        }

        // Get file extension
        const extension = file.name.split(".").pop() || "jpg";
        const fileName = `${uuidv4()}.${extension}`;

        // Build storage path based on type
        let storagePath: string;
        switch (type) {
            case "payment-receipt":
                storagePath = `shops/${shopId}/payment-receipts/${orderId}/${fileName}`;
                break;
            case "product":
                storagePath = `shops/${shopId}/products/${fileName}`;
                break;
            case "profile":
                storagePath = `shops/${shopId}/profile/${fileName}`;
                break;
            default:
                storagePath = `shops/${shopId}/uploads/${fileName}`;
        }

        // Get bucket
        const storage = getStorage(app);
        const bucket = storage.bucket();

        // Convert File to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create a file reference
        const fileRef = bucket.file(storagePath);

        // Upload file
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
                metadata: {
                    shopId,
                    orderId: orderId || "",
                    uploadedAt: new Date().toISOString(),
                    originalName: file.name,
                },
            },
        });

        // Make file publicly accessible
        await fileRef.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: storagePath,
            fileName,
        });

    } catch (error: any) {
        console.error("Error uploading image:", error);
        return NextResponse.json(
            { error: error.message || "Error al subir la imagen" },
            { status: 500 }
        );
    }
}
