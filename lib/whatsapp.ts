import axios from "axios";

// Evolution API configuration - MUST be set in environment variables
const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";

if (!EVOLUTION_URL && process.env.NODE_ENV === "production") {
  console.warn("⚠️ EVOLUTION_API_URL not configured. WhatsApp features will not work.");
}

// Axios client configured for Evolution API
const evolutionClient = axios.create({
  baseURL: EVOLUTION_URL,
  headers: {
    apikey: EVOLUTION_KEY,
    "Content-Type": "application/json",
  },
});

export interface WhatsAppInstance {
  instanceName: string;
  status: "open" | "close" | "connecting";
  owner?: string;
}

/**
 * WhatsApp Service using Evolution API
 */
class WhatsAppService {
  /**
   * Format phone number for WhatsApp (Mexico format)
   */
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, "");

    // Mexico: Add country code if missing
    if (formatted.length === 10) {
      // Mexican mobile numbers
      formatted = "52" + formatted;
    } else if (formatted.length === 11 && formatted.startsWith("1")) {
      // US/Canada format, keep as is
    }

    return formatted;
  }

  /**
   * Get all WhatsApp instances
   */
  async getInstances(): Promise<WhatsAppInstance[]> {
    try {
      const response = await evolutionClient.get("/instance/fetchInstances");
      return response.data.map((item: any) => ({
        instanceName: item.instance?.instanceName || item.name,
        status: item.instance?.status || item.state || "close",
        owner: item.instance?.owner,
      }));
    } catch (error) {
      console.error("❌ Error fetching instances:", error);
      return [];
    }
  }

  /**
   * Find active instance for a shop/company
   */
  async findActiveInstance(shopId: string): Promise<string | null> {
    try {
      const instances = await this.getInstances();
      const active = instances.find(
        (inst) =>
          inst.instanceName.includes(shopId) && inst.status === "open"
      );
      return active?.instanceName || null;
    } catch (error) {
      console.error("❌ Error finding active instance:", error);
      return null;
    }
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(
    instanceName: string,
    phone: string,
    text: string
  ): Promise<boolean> {
    try {
      if (!instanceName || !phone || !text) {
        console.warn("⚠️ WhatsApp: Missing required parameters");
        return false;
      }

      const formattedPhone = this.formatPhone(phone);
      const whatsappNumber = `${formattedPhone}@s.whatsapp.net`;

      const payload = {
        number: whatsappNumber,
        options: {
          delay: 1000,
          presence: "composing",
          linkPreview: false,
        },
        textMessage: { text },
      };

      await evolutionClient.post(
        `/message/sendText/${instanceName}`,
        payload
      );

      console.log(`✅ WhatsApp sent to ${phone}`);
      return true;
    } catch (error: any) {
      console.error("❌ WhatsApp send error:", error.message);
      return false;
    }
  }

  /**
   * Send message by shop ID (auto-finds instance)
   */
  async sendMessageByShop(
    shopId: string,
    phone: string,
    text: string
  ): Promise<boolean> {
    const instanceName = await this.findActiveInstance(shopId);
    if (!instanceName) {
      console.warn(`⚠️ No active WhatsApp instance for shop: ${shopId}`);
      return false;
    }
    return this.sendMessage(instanceName, phone, text);
  }

  /**
   * Send media file (image, document, etc.)
   */
  async sendMedia(
    instanceName: string,
    phone: string,
    mediaUrl: string,
    caption: string = "",
    mediaType: "image" | "document" | "video" | "audio" = "image"
  ): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhone(phone);

      const payload = {
        number: formattedPhone,
        options: {
          delay: 1000,
          presence: "composing",
        },
        mediaMessage: {
          mediatype: mediaType,
          caption,
          media: mediaUrl,
        },
      };

      await evolutionClient.post(
        `/message/sendMedia/${instanceName}`,
        payload
      );

      console.log(`✅ WhatsApp media sent to ${phone}`);
      return true;
    } catch (error: any) {
      console.error("❌ WhatsApp media error:", error.message);
      return false;
    }
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(
    instanceName: string,
    webhookUrl?: string
  ): Promise<{ qrcode?: string; instance?: any } | null> {
    try {
      const payload: any = {
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      };

      if (webhookUrl) {
        payload.webhook = webhookUrl;
        payload.webhook_by_events = true;
        payload.events = ["MESSAGES_UPSERT", "CONNECTION_UPDATE"];
      }

      const response = await evolutionClient.post("/instance/create", payload);
      console.log(`✅ Instance created: ${instanceName}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Create instance error:", error.message);
      return null;
    }
  }

  /**
   * Get QR code for instance connection
   */
  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await evolutionClient.get(
        `/instance/connect/${instanceName}`
      );
      return response.data?.base64 || response.data?.qrcode?.base64 || null;
    } catch (error: any) {
      console.error("❌ QR code error:", error.message);
      return null;
    }
  }

  /**
   * Delete/logout an instance
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      // First logout
      await evolutionClient
        .delete(`/instance/logout/${instanceName}`)
        .catch(() => {});

      // Then delete
      await evolutionClient.delete(`/instance/delete/${instanceName}`);

      console.log(`✅ Instance deleted: ${instanceName}`);
      return true;
    } catch (error: any) {
      console.error("❌ Delete instance error:", error.message);
      return false;
    }
  }

  /**
   * Get instance connection status
   */
  async getStatus(instanceName: string): Promise<string> {
    try {
      const response = await evolutionClient.get(
        `/instance/connectionState/${instanceName}`
      );
      return response.data?.state || "unknown";
    } catch (error) {
      return "error";
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;
