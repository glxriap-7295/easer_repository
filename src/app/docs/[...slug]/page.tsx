import { redirect } from "next/navigation";
// Reserved for future per-document deep links; for now redirect to the index.
export default function DocSlug() {
  redirect("/docs");
}
