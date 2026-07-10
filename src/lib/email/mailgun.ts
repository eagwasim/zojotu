import type { EmailProvider, EmailMessage } from "./provider";

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
    const url = `https://api.mailgun.net/v3/${this.domain}/messages`;

    const form = new URLSearchParams();
    form.append("from", this.from);
    form.append("to", message.to);
    form.append("subject", message.subject);
    form.append("html", message.html);
    if (message.text) form.append("text", message.text);

    console.log(message);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
      },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Mailgun] Send failed:", err);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  }
}
