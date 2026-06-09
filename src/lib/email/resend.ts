import "server-only";
import type { EmailProvider, EmailMessage } from "./provider";

// Resend (https://resend.com) — simple HTTP API, no SMTP needed. Recommended
// for production on Vercel.
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  async send(msg: EmailMessage) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "easer.data@gmail.com",
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
          html: msg.html
        })
      });
      if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
      const data = await res.json();
      return { ok: true, id: data?.id };
    } catch (err: any) {
      return { ok: false, error: String(err?.message || err) };
    }
  }
}
