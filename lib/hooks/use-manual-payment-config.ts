import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ShopManualPaymentConfig } from "@/lib/types/payment.types";

/**
 * Hook to fetch manual payment configuration for a shop.
 * Used to share logic between CheckoutDrawer and MealPrepModal.
 */
export function useManualPaymentConfig(shopId: string | undefined | null) {
    const [config, setConfig] = useState<ShopManualPaymentConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!shopId) {
            setLoading(false);
            return;
        }

        async function loadConfig() {
            try {
                const configRef = doc(db, "shops", shopId as string, "settings", "payments");
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) {
                    const data = configSnap.data() as ShopManualPaymentConfig;
                    // Only set config if it's enabled and has at least one active payment method
                    if (data.enabled && data.paymentMethods?.some(m => m.isActive)) {
                        setConfig(data);
                    } else {
                        setConfig(null);
                    }
                } else {
                    setConfig(null);
                }
            } catch (err) {
                console.error("Error loading manual payment config:", err);
                setConfig(null);
            } finally {
                setLoading(false);
            }
        }

        loadConfig();
    }, [shopId]);

    return { config, loading };
}
