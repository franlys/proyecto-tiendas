"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth, ShopsProvider, useShops } from "@/components/shared";

/**
 * Admin Profile Page - Now redirects to unified Agency Panel
 *
 * This page used to have its own configuration UI, but to simplify
 * the user experience, we now redirect to /agency/shop/{shopId}
 * where all shop configuration is centralized.
 */

function ProfileRedirect() {
    const router = useRouter();
    const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
    const { shops, isLoading: shopsLoading } = useShops();

    useEffect(() => {
        // Wait for auth and shops to load
        if (authLoading || shopsLoading) return;

        // Determine which shop to redirect to
        let targetShop: string | null = null;

        if (isSuperAdmin) {
            // Super Admin: redirect to first shop or agency dashboard
            if (shops.length > 0) {
                targetShop = shops[0].slug;
            } else {
                router.push("/agency");
                return;
            }
        } else if (user?.shopId) {
            // Shop owner: redirect to their shop
            const shop = shops.find(s => s.id === user.shopId || s.slug === user.shopId);
            targetShop = shop?.slug || user.shopId;
        }

        if (targetShop) {
            router.push(`/agency/shop/${targetShop}`);
        } else {
            // Fallback to login if no shop found
            router.push("/login");
        }
    }, [authLoading, shopsLoading, isSuperAdmin, user?.shopId, shops, router]);

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            <p className="text-white/50">Redirigiendo al panel de configuración...</p>
        </div>
    );
}

export default function AdminProfilePage() {
    return (
        <AuthProvider>
            <ShopsProvider>
                <ProfileRedirect />
            </ShopsProvider>
        </AuthProvider>
    );
}
