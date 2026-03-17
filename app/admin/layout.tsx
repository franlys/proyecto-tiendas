"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ThemeProvider, AuthProvider, useAuth, ShopsProvider, useShops, AgencyProvider, NotificationsProvider } from "@/components/shared";
import { SupportWidget } from "@/components/admin/support-widget";
import { PushSetup } from "@/components/admin/push-setup";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, isSuperAdmin } = useAuth();
  const { getShop } = useShops();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Phase 11: Subscription Guard
      // If not super admin, check shop subscription status
      if (!isSuperAdmin && user?.shopId) {
        const shop = getShop(user.shopId);
        // If shop exists and has bad status
        if (shop && (shop.subscriptionStatus === "past_due" || shop.subscriptionStatus === "canceled")) {
          // Allow only billing page
          if (pathname !== "/admin/billing") {
            router.push("/admin/billing");
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, router, isSuperAdmin, user, getShop, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get shopId for notifications
  const shopId = user?.shopId || null;
  const shop = shopId ? (getShop(shopId) || null) : null;

  return (
    <ThemeProvider shop={shop as any}>
      <NotificationsProvider shopId={shopId}>
        {shopId && <PushSetup shopId={shopId} />}
        {children}
      </NotificationsProvider>
    </ThemeProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ShopsProvider>
        <AgencyProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
          <SupportWidget />
        </AgencyProvider>
      </ShopsProvider>
    </AuthProvider>
  );
}
