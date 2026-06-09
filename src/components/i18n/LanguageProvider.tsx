"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { DICTS, type Lang } from "@/i18n/dictionaries";

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  chosen: boolean;
}

const Ctx = createContext<I18n | null>(null);
export const useT = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useT must be used within <LanguageProvider>");
  return v;
};

const COOKIE = "easer_lang";

function readStored(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )easer_lang=(en|es)/);
  if (m) return m[1] as Lang;
  const ls = window.localStorage.getItem(COOKIE);
  return ls === "en" || ls === "es" ? ls : null;
}

function lookup(lang: Lang, key: string): string {
  const parts = key.split(".");
  let cur: any = DICTS[lang];
  for (const p of parts) cur = cur?.[p];
  if (typeof cur === "string") return cur;
  // fallback to English
  let en: any = DICTS.en;
  for (const p of parts) en = en?.[p];
  return typeof en === "string" ? en : key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [chosen, setChosen] = useState(true); // assume chosen during SSR to avoid flash

  useEffect(() => {
    const stored = readStored();
    if (stored) { setLangState(stored); setChosen(true); }
    else setChosen(false);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    setChosen(true);
    try {
      document.cookie = `${COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      window.localStorage.setItem(COOKIE, l);
      document.documentElement.lang = l;
    } catch {}
  }

  const t = (key: string) => lookup(lang, key);

  return (
    <Ctx.Provider value={{ lang, setLang, t, chosen }}>
      {!chosen && <LanguageScreen onPick={setLang} />}
      {children}
    </Ctx.Provider>
  );
}

function LanguageScreen({ onPick }: { onPick: (l: Lang) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-lg font-bold text-white">E</span>
        <h1 className="mt-4 font-serif text-xl font-bold text-stone-900">{DICTS.en.lang.chooseTitle}</h1>
        <p className="mt-1 text-sm text-stone-500">{DICTS.en.lang.chooseSubtitle}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => onPick("en")} className="rounded-lg border border-stone-300 px-4 py-3 font-medium text-stone-800 hover:bg-stone-50">English</button>
          <button onClick={() => onPick("es")} className="rounded-lg bg-brand-700 px-4 py-3 font-medium text-white hover:bg-brand-800">Español</button>
        </div>
      </div>
    </div>
  );
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div className={`inline-flex overflow-hidden rounded-lg border border-stone-300 text-xs ${className}`}>
      {(["en", "es"] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`px-2 py-1 font-medium uppercase ${lang === l ? "bg-brand-700 text-white" : "bg-white text-stone-600 hover:bg-stone-100"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
