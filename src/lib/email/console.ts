import "server-only";
import type { EmailProvider, EmailMessage } from "./provider";

// Default provider for dev/demo: logs the email instead of sending. The full
// workflow runs end-to-end without any SMTP credentials.
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  async send(msg: EmailMessage) {
    console.log("\n========== EMAIL (console provider) ==========");
    console.log("To:", Array.isArray(msg.to) ? msg.to.join(", ") : msg.to);
    console.log("Subject:", msg.subject);
    console.log(msg.text);
    console.log("==============================================\n");
    return { ok: true, id: "console" };
  }
}
