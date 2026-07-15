"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "./clsx";

/* ────────────────────────────────────────────────────────────────────────────
   Shared visual language for the EASER platform (Design Boards A & B).
   Because published projects do not carry photographic assets, we render a
   consistent, on-brand generated "scene" (layered ridge lines + a seismograph
   trace over a forest-green gradient) as the hero image for cards and detail
   pages. The scene is deterministic per seed so a project always looks the same.
   ──────────────────────────────────────────────────────────────────────────── */

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const SCENES: [string, string, string][] = [
  ["#173722", "#255736", "#4f8d64"], // deep forest
  ["#122a1b", "#1e472c", "#2f6f45"], // pine
  ["#1e472c", "#2f6f45", "#7fb08f"], // moss
  ["#173722", "#255736", "#d99a2f"], // forest + gold horizon
];

/** Generated hero scene used wherever the mockups show a photograph. */
export function CategoryVisual({ seed = "easer", label, className, rounded = "rounded-xl" }:
  { seed?: string; label?: string; className?: string; rounded?: string }) {
  const h = hash(seed);
  const [c0, c1, c2] = SCENES[h % SCENES.length];
  const gid = `g${h % 100000}`;
  // Two deterministic ridge lines + a seismograph trace.
  const ridge = (base: number, amp: number, salt: number) => {
    let d = `M0 ${base}`;
    for (let x = 0; x <= 400; x += 40) {
      const y = base + Math.sin((x + salt) / 55) * amp + ((hash(seed + x + salt) % amp) - amp / 2);
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return d + " L400 220 L0 220 Z";
  };
  let trace = "M0 96";
  for (let x = 0; x <= 400; x += 8) {
    const spike = (hash(seed + "t" + x) % 100) > 88 ? ((hash(seed + x) % 40) - 20) : ((hash(seed + x) % 10) - 5);
    trace += ` L${x} ${(96 + spike).toFixed(1)}`;
  }
  return (
    <div className={clsx("relative overflow-hidden", rounded, className)} aria-hidden>
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c2} />
            <stop offset="55%" stopColor={c1} />
            <stop offset="100%" stopColor={c0} />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill={`url(#${gid})`} />
        <circle cx="320" cy="52" r="34" fill="#e6b455" opacity="0.28" />
        <path d={trace} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" />
        <path d={ridge(150, 20, 30)} fill={c0} opacity="0.55" />
        <path d={ridge(178, 26, 90)} fill={c0} opacity="0.85" />
      </svg>
      {label && (
        <span className="absolute bottom-2 left-3 text-[11px] font-medium uppercase tracking-wide text-white/80">{label}</span>
      )}
    </div>
  );
}

/** Full-bleed hero backdrop for the home page (mountains + gold sun + map pins). */
export function HeroScene({ className }: { className?: string }) {
  return (
    <div className={clsx("absolute inset-0", className)} aria-hidden>
      <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#255736" />
            <stop offset="45%" stopColor="#173722" />
            <stop offset="100%" stopColor="#122a1b" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#sky)" />
        <circle cx="880" cy="150" r="120" fill="#e6b455" opacity="0.20" />
        <circle cx="880" cy="150" r="70" fill="#e6b455" opacity="0.18" />
        <path d="M0 380 L180 250 L340 360 L520 220 L720 380 L900 260 L1080 360 L1200 300 L1200 560 L0 560 Z" fill="#122a1b" opacity="0.9" />
        <path d="M0 440 L220 330 L430 430 L640 320 L860 440 L1080 350 L1200 420 L1200 560 L0 560 Z" fill="#0d2014" opacity="0.95" />
      </svg>
    </div>
  );
}

/** Count-up animation used by the Scientific Activity cards. */
export function AnimatedCount({ value, duration = 1100 }: { value: number | undefined; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (value == null) return;
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && run()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{value == null ? "—" : n}</span>;
}

/** Horizontal numbered stepper (Contribute / Import flows). */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={clsx("flex flex-wrap items-center gap-x-3 gap-y-2 text-sm", className)}>
      {steps.map((label, i) => {
        const state = i + 1 === current ? "on" : i + 1 < current ? "done" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={clsx("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition",
              state === "on" && "bg-brand-700 text-white",
              state === "done" && "bg-brand-200 text-brand-800",
              state === "todo" && "bg-stone-200 text-stone-500")}>{i + 1}</span>
            <span className={clsx(state === "on" ? "font-semibold text-brand-800" : "text-stone-500")}>{label}</span>
            {i < steps.length - 1 && <span className="text-stone-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
