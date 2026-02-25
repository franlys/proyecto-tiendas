import { Resend } from "resend";
import nodemailer from "nodemailer";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Gmail transporter (fallback)
const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
}

/**
 * Send email using Resend (primary) or Gmail (fallback)
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, from, attachments } = options;

  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const data = await resend.emails.send({
        from: from || "Linko <no-reply@linko.app>",
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
        // Fall through to Gmail
      } else {
        console.log(`📧 Email sent via Resend to ${to}`);
        return { success: true, messageId: data.data?.id };
      }
    } catch (error: any) {
      console.error("❌ Resend error:", error.message);
      // Fall through to Gmail
    }
  }

  // Fallback to Gmail
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const info = await gmailTransporter.sendMail({
        from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      console.log(`📧 Email sent via Gmail to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error("❌ Gmail error:", error.message);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "No email service configured" };
}

/**
 * Generate branded HTML email template
 */
export function generateEmailTemplate(
  content: string,
  branding?: BrandingConfig
): string {
  const {
    name = "Linko",
    logo = "",
    primaryColor = "#06b6d4", // cyan-500
    secondaryColor = "#0f172a", // slate-900
  } = branding || {};

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

    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 32px; text-align: center;">
      ${logo
      ? `<img src="${logo}" alt="${name}" style="max-height: 60px; margin-bottom: 8px;">`
      : `<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${name}</h1>`
    }
    </div>

    <!-- Content -->
    <div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 15px;">
      ${content}
    </div>

    <!-- Footer -->
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
 */
export const emailTemplates = {
  /**
   * Appointment confirmation email
   */
  appointmentConfirmation: (data: {
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    shopName: string;
    shopAddress?: string;
  }) => {
    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ¡Cita Confirmada!
      </h2>

      <p style="margin: 0 0 16px;">
        Hola <strong>${data.clientName}</strong>,
      </p>

      <p style="margin: 0 0 24px;">
        Tu cita ha sido confirmada exitosamente.
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
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #06b6d4;">${data.time}</td>
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
    `);
  },

  /**
   * Order confirmation email
   */
  orderConfirmation: (data: {
    clientName: string;
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shopName: string;
  }) => {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            ${item.name} x${item.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
            $${item.price.toFixed(2)}
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
          <td style="padding: 16px 0; text-align: right; font-weight: 700; font-size: 16px; color: #06b6d4;">
            $${data.total.toFixed(2)}
          </td>
        </tr>
      </table>

      <p style="margin: 0; color: #64748b; font-size: 13px;">
        Te notificaremos cuando tu pedido esté listo.
      </p>
    `);
  },

  /**
   * Welcome email for new shop owners
   */
  welcomeShopOwner: (data: { name: string; shopName: string }) => {
    return generateEmailTemplate(`
      <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px;">
        ¡Bienvenido a Linko!
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
      </p>
    `);
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
      </p>
    `);
  },
};

export default { sendEmail, generateEmailTemplate, emailTemplates };
