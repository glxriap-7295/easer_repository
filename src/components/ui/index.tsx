import Link from "next/link";
import { clsx } from "./clsx";

export function Button({
  children, variant = "primary", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
    ghost: "text-brand-700 hover:bg-brand-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  }[variant];
  return (
    <button
      className={clsx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed", styles, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  const styles = variant === "primary" ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50";
  return (
    <Link href={href} className={clsx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", styles, className)}>
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border border-stone-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const styles = {
    slate: "bg-stone-100 text-stone-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-brand-100 text-brand-700"
  }[color];
  return <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", styles)}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx("w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500", props.className)} />;
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}
