import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        let shopName = "Linko";
        let shopDescription = "Linko: La plataforma universal para conectar tu negocio con tus clientes.";
        let startUrl = `/${shopId}?pwa=1`;
        let themeColor = "#0F172A";
        let iconUrl = "/icons/icon-192.png";
        let icon512Url = "/icons/icon-512.png";

        // Fetch shop data
        const shopsRef = collection(db, "shops");
        const q = query(shopsRef, where("slug", "==", shopId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const shopData = snapshot.docs[0].data();
            shopName = shopData.name || shopName;
            shopDescription = shopData.description || shopDescription;
            themeColor = shopData.theme?.colors?.primary || themeColor;
            if (shopData.logo) {
                iconUrl = shopData.logo;
                icon512Url = shopData.logo;
            }
        } else {
            const docRef = doc(db, "shops", shopId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const shopData = docSnap.data();
                shopName = shopData.name || shopName;
                shopDescription = shopData.description || shopDescription;
                themeColor = shopData.theme?.colors?.primary || themeColor;
                if (shopData.logo) {
                    iconUrl = shopData.logo;
                    icon512Url = shopData.logo;
                }
            }
        }

        const getMimeType = (url: string) => {
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
            if (lowerUrl.includes('.webp')) return 'image/webp';
            if (lowerUrl.includes('.svg')) return 'image/svg+xml';
            return 'image/png';
        };

        const mimeType = getMimeType(iconUrl);

        const manifest = {
            id: `/${shopId}`,
            name: shopName,
            short_name: shopName,
            description: shopDescription,
            start_url: startUrl,
            display: "standalone",
            background_color: "#0F172A",
            theme_color: themeColor,
            orientation: "portrait-primary",
            icons: [
                {
                    src: iconUrl,
                    sizes: "192x192",
                    type: mimeType,
                    purpose: "any"
                },
                {
                    src: icon512Url,
                    sizes: "512x512",
                    type: mimeType,
                    purpose: "any"
                }
            ],
            lang: "es",
            dir: "ltr"
        };

        return NextResponse.json(manifest, {
            headers: {
                "Content-Type": "application/manifest+json",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch (error) {
        console.error("Error generating manifest:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
