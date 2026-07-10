import type { EmailProvider, EmailMessage } from "./provider";
import { MailgunProvider } from "./mailgun";

function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || "mailgun";

  switch (provider) {
    case "mailgun":
      return new MailgunProvider();
    default:
      return new MailgunProvider();
  }
}

let emailProvider: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = createEmailProvider();
  }
  return emailProvider;
}

export async function sendEmail(message: EmailMessage) {
  return getProvider().send(message);
}

export type { EmailMessage, EmailProvider };
