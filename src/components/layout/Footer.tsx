import { PARTNERS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-stone-700">EASER Research Data Hub</p>
            <p>GitHub-centric research repository management.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {PARTNERS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-stone-400">
          Source of truth:{" "}
          <a className="underline" href="https://github.com/glxriap-7295/easer_repository" target="_blank" rel="noreferrer">
            github.com/glxriap-7295/easer_repository
          </a>
        </p>
      </div>
    </footer>
  );
}
