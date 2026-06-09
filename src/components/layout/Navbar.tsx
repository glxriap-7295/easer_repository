"use client";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/docs", label: "Documentation" },
  { href: "/contribute", label: "Contribute" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm text-white">E</span>
          <span>EASER<span className="font-normal text-slate-500"> Data Hub</span></span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
          <Link href="/contribute" className="ml-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Contribute
          </Link>
          <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-700">Admin</Link>
        </div>

        <button className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          {[...links, { href: "/admin", label: "Admin" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
