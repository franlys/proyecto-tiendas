import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";

export async function GET() {
    const result: Record<string, any> = {
        timestamp: new Date().toISOString(),
        storageBucketEnv: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "NOT SET",
    };

    try {
        const storage = adminStorage();
        if (!storage) {
            result.storage = { initialized: false, error: "adminStorage() returned null" };
            return NextResponse.json(result);
        }

        const bucket = storage.bucket();
        result.storage = {
            initialized: true,
            bucketName: bucket.name,
        };

        // Try to upload a small test file
        const testFile = bucket.file("_test/storage-test.txt");
        await testFile.save("Storage test OK", { metadata: { contentType: "text/plain" } });

        const [signedUrl] = await testFile.getSignedUrl({
            action: "read",
            expires: "03-01-2027",
        });

        result.uploadTest = { success: true, signedUrl: signedUrl.substring(0, 80) + "..." };

        // Clean up
        await testFile.delete().catch(() => {});

    } catch (err: any) {
        result.storage = { error: err.message };
    }

    return NextResponse.json(result);
}

export const runtime = "nodejs";
