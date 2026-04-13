import nodemailer from "nodemailer";
import { getEmailSettings, getCommunitySettings } from "./firestore";

export interface EmailNotificationPayload {
  subject: string;
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

function buildEmailHtml(communityName: string, payload: EmailNotificationPayload): string {
  const { title, body, ctaUrl, ctaLabel } = payload;
  const ctaBlock = ctaUrl
    ? `<tr>
        <td style="padding:0 32px 32px;">
          <a href="${ctaUrl}"
             style="display:inline-block;background-color:#0ea5e9;color:#ffffff;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
            ${ctaLabel ?? "Ver conteúdo"}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background-color:#161b22;
                      border-radius:12px;overflow:hidden;border:1px solid #30363d;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0ea5e9;padding:24px 32px;">
              <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">
                ${communityName}
              </h1>
            </td>
          </tr>
          <!-- Title + body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e6edf3;">
                ${title}
              </h2>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#8b949e;">
                ${body}
              </p>
            </td>
          </tr>
          <!-- CTA -->
          ${ctaBlock}
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #30363d;">
              <p style="margin:0;font-size:12px;color:#484f58;">
                Você recebe este e-mail por ser membro de ${communityName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContentNotification(
  payload: EmailNotificationPayload,
  recipients: string[]
): Promise<{ sent: number; error?: string }> {
  if (!recipients.length) return { sent: 0 };

  const [settings, communitySettings] = await Promise.all([
    getEmailSettings(),
    getCommunitySettings(),
  ]);

  if (!settings.enabled || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
    return { sent: 0, error: "E-mail não configurado ou desativado" };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
  });

  const html = buildEmailHtml(communitySettings.communityName, payload);
  const from = `"${settings.senderName || communitySettings.communityName}" <${settings.senderEmail || settings.smtpUser}>`;

  let sent = 0;
  for (const email of recipients) {
    try {
      await transporter.sendMail({ from, to: email, subject: payload.subject, html });
      sent++;
    } catch {
      // continue sending to remaining recipients
    }
  }

  return { sent };
}
