"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";

// No duplicate "Contribute" entry and no public "Admin" link — privileged
// areas appear only inside the authenticated account menu (UserMenu).
const links = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/docs", label: "Documentation" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-brand-800">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 font-sans text-sm text-white">E</span>
          <span>EASER<span className="font-sans font-normal text-stone-500"> Data Hub</span></span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active(l.href) ? "bg-brand-100 text-brand-800" : "text-stone-600 hover:bg-stone-100 hover:text-brand-800"
              }`}>
              {l.label}
            </Link>
          ))}
          <Link href="/contribute" className="ml-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-800">Contribute</Link>
          <div className="ml-2"><UserMenu /></div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <UserMenu />
          <button className="rounded-lg p-2 text-stone-600 hover:bg-stone-100" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-stone-200 bg-stone-50 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-100">{l.label}</Link>
          ))}
          <Link href="/contribute" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-brand-800 hover:bg-stone-100">Contribute</Link>
        </div>
      )}
    </header>
  );
}
