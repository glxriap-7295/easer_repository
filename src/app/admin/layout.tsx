import { redirect } from "next/navigation";
import { getServerUser, hasRole } from "@/lib/auth";

// SERVER-SIDE guard for every /admin/* route. Runs before any admin page is
// rendered or sent to the browser. Non-authenticated users are sent to login;
// authenticated users without at least curator rank get a 404 (the area is
// never revealed to them). Admin-only sub-pages add their own stricter check.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/admin");
  if (!hasRole(user, "curator")) redirect("/dashboard");
  return <>{children}</>;
}
