import Image from "next/image";
import Link from "next/link";

const storeLink = "https://aquacurve.sjv.io/c/7587435/3859681/51362?trafsrc=impact";

export default function AquaCurvePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#031216] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,.20),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(14,116,144,.18),transparent_30%)]" />
      <header className="relative z-10 border-b border-cyan-950 bg-[#031216]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3"><Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority /><span className="hidden text-sm font-black uppercase tracking-[.15em] text-cyan-100 sm:block">Affiliate Services</span></Link>
          <Link href="/affiliate-services" className="rounded-lg border border-cyan-700 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300">← All Affiliate Picks</Link>
        </div>
      </header>
      <section className="relative z-10 flex min-h-[70vh] items-center px-5 py-20 md:px-8">
        <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-cyan-400/30 bg-cyan-500/[.06] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,.4)] sm:p-14">
          <p className="text-xs font-black uppercase tracking-[.3em] text-cyan-300">New WASCIK retail partner</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-[-.05em] sm:text-7xl">AquaCurve</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">The AquaCurve product collection will be added here later. For now, use the main-store link to explore its current poolside and outdoor-living catalog.</p>
          <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-9 inline-flex min-h-14 items-center justify-center rounded-xl bg-cyan-300 px-8 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-200">Shop the AquaCurve Main Store →</a>
          <p className="mx-auto mt-8 max-w-2xl text-sm leading-6 text-slate-400">Affiliate disclosure: WASCIK may earn a commission from qualifying purchases made through this link, at no additional cost to you. Prices and availability may change.</p>
        </div>
      </section>
      <footer className="relative z-10 border-t border-cyan-950 bg-[#010709] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · AquaCurve partner page.</footer>
    </main>
  );
}
