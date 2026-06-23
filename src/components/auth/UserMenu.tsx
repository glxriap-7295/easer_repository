"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { ROLE_RANK, ROLE_LABEL } from "@/lib/roles";
import { useT } from "@/components/i18n/LanguageProvider";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export function UserMenu() {
  const { user, profile, role, loading, logout } = useAuth();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (loading) return <div className="h-9 w-9 animate-pulse rounded-full bg-stone-200" />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">{t("common.signIn")}</Link>
        <Link href="/register" className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">{t("common.register")}</Link>
      </div>
    );
  }

  const name = profile?.displayName || user.displayName || user.email || "Account";
  const isCurator = role ? ROLE_RANK[role] >= ROLE_RANK.curator : false;
  const isAdmin = role === "admin";

  async function doLogout() { setOpen(false); await logout(); router.push("/"); }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-stone-100" aria-haspopup="menu" aria-expanded={open}>
        {profile?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">{initials(name)}</span>
        )}
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-stone-700 sm:block">{name}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-card">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
            {role && <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">{ROLE_LABEL[role]}</span>}
          </div>
          <nav className="py-1 text-sm">
            <Item href="/dashboard" onClick={() => setOpen(false)}>{t("common.dashboard")}</Item>
            <Item href="/profile" onClick={() => setOpen(false)}>{t("common.profile")}</Item>
            {isCurator && <Item href="/admin/projects" onClick={() => setOpen(false)}>{t("common.reviewQueue")}</Item>}
            {isAdmin && <Item href="/admin/users" onClick={() => setOpen(false)}>{t("common.userManagement")}</Item>}
            {isAdmin && <Item href="/admin/team" onClick={() => setOpen(false)}>Team Management</Item>}
            {isAdmin && <Item href="/admin/news" onClick={() => setOpen(false)}>News Management</Item>}
            <button onClick={doLogout} className="block w-full px-4 py-2 text-left text-stone-700 hover:bg-stone-100" role="menuitem">{t("common.logout")}</button>
          </nav>
        </div>
      )}
    </div>
  );
}

function Item({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} role="menuitem" className="block px-4 py-2 text-stone-700 hover:bg-stone-100">{children}</Link>;
}
