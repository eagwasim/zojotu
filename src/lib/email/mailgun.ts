import type { EmailProvider, EmailMessage } from "./provider";
import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0

export class MailgunProvider implements EmailProvider {
  private apiKey: string;
  private domain: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY || "";
    this.domain = process.env.MAILGUN_DOMAIN || "";
    this.from = process.env.EMAIL_FROM || `Zojotu <noreply@${this.domain}>`;
  }

  async send(message: EmailMessage) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: "api",
        key: this.apiKey,
        url: "https://api.eu.mailgun.net"
    });

    try {
        const data = await mg.messages.create("mg.zojotu.com", {
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html || message.text || " ",
        });

        return { success: true, messageId: data.id };
    } catch (error) {
        console.error("[Mailgun] Send failed:", error);
        return { success: false };
    }
  }
}
