"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { localToken } from "@/lib/utils/safe-storage";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "paused" | "failed";
export type AudienceSegment = "all" | "wholesale" | "inactive" | "birthday" | "new" | "vip";
export type MediaType = "none" | "image" | "video" | "document";

export const AUDIENCE_SEGMENTS: Record<AudienceSegment, {
  label: string;
  description: string;
  icon: string;
}> = {
  all: {
    label: "Todos los Clientes",
    description: "Enviar a toda tu base de datos",
    icon: "👥",
  },
  wholesale: {
    label: "Solo Mayoristas",
    description: "Clientes con compras mayoreo",
    icon: "🏢",
  },
  inactive: {
    label: "Clientes Inactivos",
    description: "Sin compras en 30+ días",
    icon: "💤",
  },
  birthday: {
    label: "Cumpleañeros del Mes",
    description: "Clientes que cumplen este mes",
    icon: "🎂",
  },
  new: {
    label: "Clientes Nuevos",
    description: "Registrados en los últimos 7 días",
    icon: "✨",
  },
  vip: {
    label: "Clientes VIP",
    description: "Top 10% en compras",
    icon: "👑",
  },
};

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  draft: { label: "Borrador", color: "slate", icon: "📝" },
  scheduled: { label: "Programada", color: "blue", icon: "📅" },
  sending: { label: "Enviando", color: "amber", icon: "📤" },
  completed: { label: "Completada", color: "green", icon: "✅" },
  paused: { label: "Pausada", color: "purple", icon: "⏸️" },
  failed: { label: "Fallida", color: "red", icon: "❌" },
};

export interface Campaign {
  id: string;
  name: string;
  message: string;
  mediaType: MediaType;
  mediaUrl?: string;
  mediaName?: string;
  segment: AudienceSegment;
  audienceCount: number;
  status: CampaignStatus;
  progress: {
    sent: number;
    failed: number;
    total: number;
  };
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendingJob {
  campaignId: string;
  isRunning: boolean;
  currentIndex: number;
  phones: string[];
  errors: string[];
}

interface MarketingContextType {
  campaigns: Campaign[];
  currentJob: SendingJob | null;
  getCampaign: (id: string) => Campaign | undefined;
  createCampaign: (campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "progress">) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  startCampaign: (id: string, phones: string[]) => void;
  pauseCampaign: (id: string) => void;
  resumeCampaign: (id: string) => void;
  getAudienceCount: (segment: AudienceSegment) => number;
  isLoading: boolean;
}

const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

interface MarketingProviderProps {
  children: ReactNode;
  shopId: string;
}

const getStorageKey = (shopId: string) => `marketing-campaigns-${shopId}`;

// Demo campaigns
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "camp1",
    name: "Promo Día del Padre",
    message: "🎉 ¡Llegó la promoción del Día del Padre!\n\n20% de descuento en todos los servicios para papá.\n\nVálido del 10 al 16 de junio.\n\n👉 Agenda tu cita: {shopUrl}",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    mediaName: "promo-papa.jpg",
    segment: "all",
    audienceCount: 145,
    status: "completed",
    progress: { sent: 145, failed: 2, total: 147 },
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "camp2",
    name: "Lista de Precios Mayoreo",
    message: "📋 Nueva lista de precios mayorista Enero 2026\n\nDescarga el PDF adjunto con todos los productos y precios especiales para distribuidores.\n\n¿Dudas? Escríbenos directo.",
    mediaType: "document",
    mediaUrl: "/docs/lista-precios.pdf",
    mediaName: "Lista-Precios-Enero-2026.pdf",
    segment: "wholesale",
    audienceCount: 23,
    status: "completed",
    progress: { sent: 23, failed: 0, total: 23 },
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "camp3",
    name: "Reactivación Clientes",
    message: "¡Hola! 👋 Te extrañamos...\n\n¿Sabías que tenemos nuevos servicios?\n\nVuelve y recibe 15% de descuento en tu próxima visita.\n\nCódigo: VUELVE15\n\n🛍️ Ver novedades: {shopUrl}",
    mediaType: "none",
    segment: "inactive",
    audienceCount: 67,
    status: "draft",
    progress: { sent: 0, failed: 0, total: 0 },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Default audience counts (shown before real data loads)
const DEFAULT_AUDIENCE_COUNTS: Record<AudienceSegment, number> = {
  all: 0,
  wholesale: 0,
  inactive: 0,
  birthday: 0,
  new: 0,
  vip: 0,
};

export function MarketingProvider({ children, shopId }: MarketingProviderProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentJob, setCurrentJob] = useState<SendingJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [audienceCounts, setAudienceCounts] = useState<Record<AudienceSegment, number>>(DEFAULT_AUDIENCE_COUNTS);

  // Fetch real audience counts from API
  useEffect(() => {
    async function fetchAudienceCounts() {
      if (!shopId || shopId === "default") return;

      try {
        const segments: AudienceSegment[] = ["all", "wholesale", "inactive", "birthday", "new", "vip"];
        const counts: Record<AudienceSegment, number> = { ...DEFAULT_AUDIENCE_COUNTS };

        await Promise.all(
          segments.map(async (segment) => {
            try {
              const res = await fetch(`/api/marketing/audience?shopId=${shopId}&segment=${segment}&countOnly=true`);
              if (res.ok) {
                const data = await res.json();
                counts[segment] = data.count || 0;
              }
            } catch {
              // Silently fail for individual segments
            }
          })
        );

        setAudienceCounts(counts);
      } catch (error) {
        console.error("Error fetching audience counts:", error);
      }
    }

    fetchAudienceCounts();
  }, [shopId]);

  // Load campaigns from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(shopId);
    try {
      const stored = localToken.get(storageKey);
      if (stored) {
        setCampaigns(JSON.parse(stored));
      } else {
        // Start with empty campaigns instead of demo data
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      localToken.set(getStorageKey(shopId), JSON.stringify(campaigns));
    }
  }, [campaigns, isLoading, shopId]);

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns]
  );

  const createCampaign = useCallback(
    (campaignData: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "progress">): Campaign => {
      const now = new Date().toISOString();
      const newCampaign: Campaign = {
        ...campaignData,
        id: `camp-${Date.now()}`,
        progress: { sent: 0, failed: 0, total: 0 },
        createdAt: now,
        updatedAt: now,
      };
      setCampaigns((prev) => [newCampaign, ...prev]);
      return newCampaign;
    },
    []
  );

  const updateCampaign = useCallback((id: string, updates: Partial<Campaign>) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Start sending campaign - uses real Evolution API
  const startCampaign = useCallback(async (id: string, phones: string[]) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    // Update status
    updateCampaign(id, {
      status: "sending",
      startedAt: new Date().toISOString(),
      progress: { sent: 0, failed: 0, total: phones.length },
    });

    // Create job
    const job: SendingJob = {
      campaignId: id,
      isRunning: true,
      currentIndex: 0,
      phones,
      errors: [],
    };
    setCurrentJob(job);

    // Send messages with safe delays (ANTI-BAN)
    for (let i = 0; i < phones.length; i++) {
      // Check if job was paused
      const currentState = await new Promise<boolean>((resolve) => {
        setCurrentJob((prev) => {
          resolve(prev?.isRunning ?? false);
          return prev;
        });
      });

      if (!currentState) {
        console.log(`[Campaign ${id}] Paused at ${i + 1}/${phones.length}`);
        break;
      }

      // Send message via API
      let success = false;
      try {
        const response = await fetch("/api/marketing/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId,
            phone: phones[i],
            message: campaign.message,
            mediaType: campaign.mediaType,
            mediaUrl: campaign.mediaUrl,
            mediaName: campaign.mediaName,
          }),
        });

        success = response.ok;
        if (!success) {
          const error = await response.json();
          console.error(`[Campaign ${id}] Failed to send to ${phones[i]}:`, error);
        }
      } catch (error) {
        console.error(`[Campaign ${id}] Error sending to ${phones[i]}:`, error);
      }

      // Update progress
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              progress: {
                sent: c.progress.sent + (success ? 1 : 0),
                failed: c.progress.failed + (success ? 0 : 1),
                total: phones.length,
              },
            }
            : c
        )
      );

      setCurrentJob((prev) =>
        prev
          ? {
            ...prev,
            currentIndex: i + 1,
            errors: success ? prev.errors : [...prev.errors, phones[i]],
          }
          : null
      );

      // CRITICAL: Safe delay between messages (10-20 seconds random) - ANTI-BAN
      if (i < phones.length - 1) {
        const delay = Math.floor(Math.random() * (20000 - 10000) + 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Mark as completed
    updateCampaign(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    setCurrentJob(null);
  }, [campaigns, shopId, updateCampaign]);

  const pauseCampaign = useCallback((id: string) => {
    if (currentJob?.campaignId === id) {
      setCurrentJob((prev) => (prev ? { ...prev, isRunning: false } : null));
      updateCampaign(id, { status: "paused" });
    }
  }, [currentJob, updateCampaign]);

  const resumeCampaign = useCallback((id: string) => {
    if (currentJob?.campaignId === id) {
      setCurrentJob((prev) => (prev ? { ...prev, isRunning: true } : null));
      updateCampaign(id, { status: "sending" });
    }
  }, [currentJob, updateCampaign]);

  const getAudienceCount = useCallback((segment: AudienceSegment): number => {
    return audienceCounts[segment] || 0;
  }, [audienceCounts]);

  return (
    <MarketingContext.Provider
      value={{
        campaigns,
        currentJob,
        getCampaign,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        startCampaign,
        pauseCampaign,
        resumeCampaign,
        getAudienceCount,
        isLoading,
      }}
    >
      {children}
    </MarketingContext.Provider>
  );
}

export function useMarketing() {
  const context = useContext(MarketingContext);
  if (context === undefined) {
    throw new Error("useMarketing must be used within a MarketingProvider");
  }
  return context;
}
