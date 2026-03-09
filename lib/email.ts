import { Resend } from "resend";

// Initialize Resend client (lazy initialization to avoid issues in client components)
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (typeof window !== "undefined") {
    // Running in browser - can't use Resend
    return null;
  }
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface BrandingConfig {
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundImage?: string;
}

/**
 * Send email using Resend
 * NOTE: This function only works server-side (API routes, server components)
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, from, attachments } = options;

  const resend = getResend();

  if (!resend) {
    console.warn("📧 Email not sent - Resend not available (client-side or missing API key)");
    return { success: false, error: "Email service not available" };
  }

  try {
    const data = await resend.emails.send({
      from: from || "Linko App <noreply@linko.app>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    if (data.error) {
      console.error("❌ Resend error:", data.error);
      return { success: false, error: String(data.error) };
    }

    console.log(`📧 Email sent via Resend to ${to}`);
    return { success: true, messageId: data.data?.id };
  } catch (error: any) {
    console.error("❌ Resend error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate branded HTML email template
 * Uses the shop's branding (name, logo, colors) for personalized emails
 */
export function generateEmailTemplate(
  content: string,
  branding?: BrandingConfig
): string {
  const {
    name = "Tu Tienda",
    logo = "",
    primaryColor = "#06b6d4", // cyan-500
    secondaryColor = "#0f172a", // slate-900
    backgroundImage,
  } = branding || {};

  const headerBackground = backgroundImage || logo;
  const backgroundStyle = headerBackground
    ? `background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${headerBackground}) center/cover no-repeat; background-color: ${primaryColor};`
    : `background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

    <!-- Header with Shop Branding -->
    <div style="${backgroundStyle} padding: 48px 32px; text-align: center;">
      ${logo
      ? `<img src="${logo}" alt="${name}" style="max-height: 80px; max-width: 200px; margin-bottom: 8px; border-radius: 8px;">`
      : `<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${name}</h1>`
    }
    </div>

    <!-- Content -->
    <div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 15px;">
      ${content}
    </div>

    <!-- Footer with Shop Name -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Enviado por <strong>${name}</strong>
      </p>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} Todos los derechos reservados.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Pre-built email templates for common notifications
 * All templates now accept shop branding for personalization
 */
export const emailTemplates = {
  /**
   * Appointment confirmation email
   */
  appointmentConfirmation: (data: {
    clientName: string;
    clientEmail?: string;
    serviceName: string;
    date: string;
    time: string;
    shopName: string;
    shopAddress?: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    shopBackgroundImage?: string;
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
      backgroundImage: data.shopBackgroundImage,
    };

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ¡Cita Confirmada!
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.clientName}</strong>,
      </p>

      <p style="margin: 0 0 24px;">
        Tu cita en <strong>${data.shopName}</strong> ha sido confirmada exitosamente.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Servicio</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Fecha</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Hora</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${data.shopPrimaryColor || "#06b6d4"};">${data.time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Lugar</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.shopName}</td>
          </tr>
          ${data.shopAddress ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Dirección</td>
            <td style="padding: 8px 0; text-align: right; color: #64748b; font-size: 13px;">${data.shopAddress}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Si necesitas cancelar o reprogramar tu cita, contáctanos con anticipación.
      </p>
    `, branding);
  },

  /**
   * Order confirmation email - Now with full shop branding
   */
  orderConfirmation: (data: {
    clientName: string;
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
    total: number;
    shopName: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    shopBackgroundImage?: string;
    deliveryType?: string;
    paymentStatus?: string;
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
      backgroundImage: data.shopBackgroundImage,
    };

    const itemsHtml = data.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; line-height: 1.4; color: #0f172a;">
            <div style="font-weight: 500;">${item.name}</div>
            ${item.quantity > 1 ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Cantidad: ${item.quantity}</div>` : ""}
            ${item.notes ? `<div style="font-size: 11px; color: #06b6d4; font-style: italic; margin-top: 2px;">${item.notes}</div>` : ""}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; vertical-align: top;">
            $${item.price.toLocaleString()}
          </td>
        </tr>
      `
      )
      .join("");

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ¡Pedido Confirmado!
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.clientName}</strong>,
      </p>

      <p style="margin: 0 0 8px;">
        Gracias por tu compra en <strong>${data.shopName}</strong>.
      </p>

      <p style="margin: 0 0 24px; color: #64748b; font-size: 13px;">
        Pedido #${data.orderNumber}
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        ${itemsHtml}
        <tr>
          <td style="padding: 16px 0; font-weight: 700; font-size: 16px;">Total</td>
          <td style="padding: 16px 0; text-align: right; font-weight: 700; font-size: 16px; color: ${data.shopPrimaryColor || "#06b6d4"};">
            $${data.total.toLocaleString()}
          </td>
        </tr>
      </table>

      ${data.deliveryType ? `
      <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="margin: 0; color: #166534; font-size: 13px;">
          📦 Tipo de entrega: <strong>${(data.deliveryType === "pickup" || data.deliveryType === "recogida" || data.deliveryType.toLowerCase().includes("recog")) ? "Pasar a recoger" : "Envío a domicilio"}</strong>
        </p>
      </div>` : ""}

      ${data.paymentStatus ? `
      <div style="background: ${data.paymentStatus === "pending_verification" ? "#fef3c7" : "#f0fdf4"}; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="margin: 0; color: ${data.paymentStatus === "pending_verification" ? "#92400e" : "#166534"}; font-size: 13px;">
          💳 Estado del pago: <strong>${data.paymentStatus === "pending_verification" ? "Verificando comprobante" :
          data.paymentStatus === "pending" ? "Pendiente de pago" :
            data.paymentStatus === "verified" ? "Pago verificado" : data.paymentStatus
        }</strong>
        </p>
      </div>` : ""}
      <p style="margin: 32px 0 0; color: #64748b; font-size: 13px;">
        Te notificaremos cuando tu pedido esté listo. ¡Gracias por tu confianza!
      </p>
    `, branding);
  },

  /**
   * New order notification for shop owner
   */
  newOrderNotification: (data: {
    shopName: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    shopBackgroundImage?: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
    total: number;
    deliveryType?: string;
    customerAddress?: string;
    paymentInfo?: {
      paymentTiming: string;
      paymentMethodName?: string;
      receiptUrl?: string;
    };
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
      backgroundImage: data.shopBackgroundImage,
    };

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px;">
            <div style="font-weight: 600; color: #0f172a;">${item.name} x${item.quantity}</div>
            ${item.notes ? `<div style="font-size: 11px; color: #06b6d4; font-style: italic; margin-top: 2px;">${item.notes}</div>` : ""}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; font-weight: 500; color: #0f172a; vertical-align: top;">
            $${item.price.toLocaleString()}
          </td>
        </tr>`
      )
      .join("");

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        🔔 ¡Nuevo Pedido Recibido!
      </h2>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">Pedido #${data.orderNumber}</strong>
        <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">
          Revisa los detalles y procesa el pedido.
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Datos del Cliente
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Nombre</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Teléfono</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.customerPhone}</td>
          </tr>
          ${data.customerEmail ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.customerEmail}</td>
          </tr>` : ""}
          ${data.customerAddress ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Dirección</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.customerAddress}</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Productos
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding: 12px 0; font-weight: 700; font-size: 16px;">Total</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${data.shopPrimaryColor || "#06b6d4"};">
              $${data.total.toLocaleString()}
            </td>
          </tr>
        </table>
      </div>

      ${data.deliveryType ? `
      <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="margin: 0; color: #166534; font-size: 13px;">
          📦 <strong>${data.deliveryType === "pickup" || data.deliveryType === "recogida" ? "Para recoger en tienda" : "Envío a domicilio"}</strong>
        </p>
      </div>` : ""}

      ${data.paymentInfo ? `
      <div style="background: ${data.paymentInfo.paymentTiming === "pay_now" ? "#dbeafe" : "#f1f5f9"}; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <p style="margin: 0; color: ${data.paymentInfo.paymentTiming === "pay_now" ? "#1e40af" : "#475569"}; font-size: 13px;">
          💳 <strong>${data.paymentInfo.paymentTiming === "pay_now" ? `Pago anticipado - ${data.paymentInfo.paymentMethodName || "Transferencia"}` : "Pago al recibir"}</strong>
          ${data.paymentInfo.receiptUrl ? " (Comprobante adjunto)" : ""}
        </p>
      </div>` : ""}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://linko.app"}/admin/orders"
          style="display: inline-block; background: linear-gradient(135deg, ${data.shopPrimaryColor || "#06b6d4"}, #0f172a); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Ver Pedido
        </a>
      </div>`, branding);
  },

  /**
   * Welcome email for new shop owners
   */
  welcomeShopOwner: (data: { name: string; shopName: string }) => {
    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ¡Bienvenido!
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.name}</strong>,
      </p>

      <p style="margin: 0 0 24px;">
        Tu tienda <strong>${data.shopName}</strong> ha sido creada exitosamente.
        Ahora puedes empezar a configurar tu negocio y recibir clientes.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://linko.app"}/admin"
          style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Ir a mi Panel
        </a>
      </div>

      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Si tienes alguna pregunta, nuestro equipo de soporte está aquí para ayudarte.
      </p>`, { name: data.shopName });
  },

  /**
   * Password reset email
   */
  passwordReset: (data: { name: string; resetLink: string }) => {
    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        Restablecer Contraseña
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.name}</strong>,
      </p>

      <p style="margin: 0 0 24px;">
        Recibimos una solicitud para restablecer tu contraseña.
        Haz clic en el botón de abajo para crear una nueva.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.resetLink}"
          style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Restablecer Contraseña
        </a>
      </div>

      <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
        Este enlace expirará en 1 hora.
      </p>

      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Si no solicitaste este cambio, ignora este correo.
      </p>`);
  },

  /**
   * Appointment reminder email (sent same day or day before)
   */
  appointmentReminder: (data: {
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    shopName: string;
    shopAddress?: string;
    shopPhone?: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    shopBackgroundImage?: string;
    isToday?: boolean;
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
      backgroundImage: data.shopBackgroundImage,
    };

    // Format date in Spanish
    const dateObj = new Date(data.date + "T12:00:00");
    const dateStr = dateObj.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const urgencyText = data.isToday
      ? "¡Tu cita es HOY!"
      : "Tu cita es mañana";

    const urgencyColor = data.isToday ? "#dc2626" : "#f59e0b";

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ⏰ ${urgencyText}
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.clientName}</strong>,
      </p>

      <p style="margin: 0 0 24px;">
        Te recordamos que tienes una cita programada en <strong>${data.shopName}</strong>.
      </p>

      <div style="background: linear-gradient(135deg, ${urgencyColor}15, ${urgencyColor}05); border-left: 4px solid ${urgencyColor}; border-radius: 0 12px 12px 0; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">📅 Fecha</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">🕐 Hora</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${data.shopPrimaryColor || "#06b6d4"};">${data.time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">✂️ Servicio</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">📍 Lugar</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.shopName}</td>
          </tr>
          ${data.shopAddress ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">🗺️ Dirección</td>
            <td style="padding: 8px 0; text-align: right; color: #64748b; font-size: 13px;">${data.shopAddress}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      ${data.shopPhone ? `
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 8px; color: #166534; font-size: 14px;">
          ¿Necesitas cambiar o cancelar tu cita?
        </p>
        <p style="margin: 0; color: #166534; font-size: 13px;">
          📞 Contáctanos: <strong>${data.shopPhone}</strong>
        </p>
      </div>
      ` : ""}

      <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
        ¡Te esperamos! 💫
      </p>
    `, branding);
  },

  /**
   * New booking notification for shop owner
   */
  newBookingNotification: (data: {
    shopName: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceName: string;
    servicePrice: number;
    date: string;
    time: string;
    duration: number;
    staffName?: string;
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
    };

    // Format date in Spanish
    const dateObj = new Date(data.date + "T12:00:00");
    const dateStr = dateObj.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        🗓️ ¡Nueva Cita Recibida!
      </h2>

      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">Cita #${data.orderNumber}</strong>
        <p style="margin: 8px 0 0; color: #1e40af; font-size: 14px;">
          Tienes una nueva reservación pendiente.
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Datos del Cliente
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">👤 Nombre</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">📱 Teléfono</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.customerPhone}</td>
          </tr>
          ${data.customerEmail ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">📧 Email</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.customerEmail}</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Detalles de la Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">✂️ Servicio</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">📆 Fecha</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">🕐 Hora</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: ${data.shopPrimaryColor || "#06b6d4"};">${data.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">⏱️ Duración</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.duration} min</td>
          </tr>
          ${data.staffName ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">👩‍💼 Atendido por</td>
            <td style="padding: 6px 0; text-align: right; color: #0f172a;">${data.staffName}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">💰 Precio</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${data.shopPrimaryColor || "#06b6d4"}; border-top: 1px solid #e2e8f0;">
              $${data.servicePrice.toLocaleString()}
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://linko.app"}/admin/bookings"
          style="display: inline-block; background: linear-gradient(135deg, ${data.shopPrimaryColor || "#06b6d4"}, #0f172a); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Ver Agenda
        </a>
      </div>
    `, branding);
  },

  /**
   * Payment receipt notification for shop owner
   */
  paymentReceiptNotification: (data: {
    shopName: string;
    shopLogo?: string;
    shopPrimaryColor?: string;
    shopBackgroundImage?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    receiptUrl: string;
    referenceNumber?: string;
    orderId?: string;
    orderNumber?: string;
  }) => {
    const branding: BrandingConfig = {
      name: data.shopName,
      logo: data.shopLogo,
      primaryColor: data.shopPrimaryColor || "#06b6d4",
      backgroundImage: data.shopBackgroundImage,
    };

    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        🔔 ¡Nuevo Comprobante de Pago!
      </h2>

      <p style="margin: 0 0 24px;">
        ${data.orderNumber ? `Pedido <strong>#${data.orderNumber}</strong> - ` : ""}Un cliente ha enviado un comprobante de pago que requiere validación.
      </p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">⚠️ Acción Requerida: </strong>
        <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">
          Revisa el comprobante y valida el pago en tu panel de administración.
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Cliente</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Teléfono</td>
            <td style="padding: 8px 0; text-align: right; color: #0f172a;">${data.customerPhone}</td>
          </tr>
          ${data.customerEmail ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td>
            <td style="padding: 8px 0; text-align: right; color: #0f172a;">${data.customerEmail}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Método de Pago</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${data.paymentMethod}</td>
          </tr>
          ${data.referenceNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Referencia</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #0f172a;">${data.referenceNumber}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;">Monto</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${data.shopPrimaryColor || "#06b6d4"}; border-top: 1px solid #e2e8f0;">
              $${data.amount.toLocaleString()} ${data.currency}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">📷 Comprobante adjunto: </p>
        <a href="${data.receiptUrl}" target="_blank" style="display: block;">
          <img src="${data.receiptUrl}" alt="Comprobante de pago" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;">
        </a>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://linko.app"}/admin/orders${data.orderId ? `?orderId=${data.orderId}` : ""}"
          style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Validar Pago
        </a>
      </div>

      <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
        O accede a tu panel de administración para gestionar los pagos pendientes.
      </p>
    `, branding);
  },
};

export default { sendEmail, generateEmailTemplate, emailTemplates };
