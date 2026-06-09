import "server-only";
import type { EmailProvider, EmailMessage } from "./provider";
import { ConsoleEmailProvider } from "./console";
import { ResendEmailProvider } from "./resend";

// Note: an SMTP (Gmail) provider can be added with `nodemailer`; the console
// and Resend providers cover dev and serverless production respectively.
export function getEmailProvider(): EmailProvider {
  const p = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  if (p === "resend") return new ResendEmailProvider();
  return new ConsoleEmailProvider();
}

export async function notify(msg: EmailMessage) {
  try {
    return await getEmailProvider().send(msg);
  } catch (err: any) {
    console.error("[email] send failed:", err);
    return { ok: false, error: String(err?.message || err) };
  }
}

export type { EmailMessage, EmailProvider } from "./provider";
