import { RepoBrowser } from "@/components/browse/RepoBrowser";
export const metadata = { title: "Browse · EASER Data Hub" };
export default function BrowsePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Browse the repository</h1>
      <p className="mt-2 text-slate-600">Explore the contents of <code>easer_repository</code> directly in your browser.</p>
      <div className="mt-8"><RepoBrowser /></div>
    </div>
  );
}
