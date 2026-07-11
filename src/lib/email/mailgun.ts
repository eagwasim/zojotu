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
          html: message.html || message.text,
        });

        return { success: true, messageId: data.id };
    } catch (error) {
        console.error("[Mailgun] Send failed:", error);
        return { success: false };
    }
 //   const url = `https://api.eu.mailgun.net/v3/${this.domain}/messages`;

   // const form = new URLSearchParams();
   // form.append("from", this.from);
   // form.append("to", message.to);
   // form.append("subject", message.subject);
   // form.append("html", message.html);
  //  if (message.text) form.append("text", message.text);

   // console.log(message);

   // const res = await fetch(url, {
   //   method: "POST",
   //   headers: {
   //     Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
    //  },
    //  body: form,
    //});

    if (!res.ok) {
      const err = await res.text();
      console.error("[Mailgun] Send failed:", err);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  }
}
