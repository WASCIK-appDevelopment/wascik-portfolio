import Image from "next/image";
import Link from "next/link";

const watchLink = "https://eurooptic.sjv.io/WOEqjX";
const storeLink = "https://eurooptic.sjv.io/c/7587435/2973190/35464";

export default function EuroOpticPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020908] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,.20),transparent_30%),radial-gradient(circle_at_88%_52%,rgba(14,116,144,.16),transparent_28%)]" />

      <header className="relative z-10 border-b border-emerald-900/60 bg-[#020908]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3">
            <Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.15em] text-emerald-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services" className="rounded-lg border border-emerald-600/70 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:border-emerald-300">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-emerald-300">WASCIK Featured Retail Partner</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl">Explore<br /><span className="text-emerald-400">EuroOptic.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Shop optics, outdoor equipment, watches, and other specialty gear through WASCIK&apos;s tracked EuroOptic links.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={watchLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-200">View Garmin Quatix 8 Pro ↗</a>
              <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-emerald-700 px-7 py-4 text-center font-bold text-emerald-100 transition hover:border-emerald-400">Shop EuroOptic ↗</a>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-lg items-center justify-center py-8">
            <div className="absolute h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border-[18px] border-slate-700 bg-gradient-to-br from-slate-950 to-emerald-950 shadow-[0_35px_100px_rgba(0,0,0,.65),0_0_45px_rgba(52,211,153,.18)] sm:h-80 sm:w-80">
              <div className="absolute -top-24 h-28 w-32 rounded-t-3xl bg-slate-800" />
              <div className="absolute -bottom-24 h-28 w-32 rounded-b-3xl bg-slate-800" />
              <div className="text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-emerald-300">Garmin</p><p className="mt-3 text-4xl font-black">QUATIX 8</p><p className="mt-2 text-sm font-bold uppercase tracking-[.22em] text-slate-400">Pro</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-emerald-950 bg-[#061411]/85 px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-2">
          <article className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[.07] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.26em] text-emerald-300">Featured from the ad</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Garmin Quatix 8 Pro</h2>
            <p className="mt-5 leading-8 text-slate-300">Use the button below to open the current EuroOptic product listing, where you can confirm specifications, price, availability, shipping, and return terms.</p>
            <a href={watchLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-emerald-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-200">Shop the Garmin Watch →</a>
          </article>
          <article className="rounded-3xl border border-cyan-500/25 bg-cyan-500/[.06] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.26em] text-cyan-300">Browse more</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Visit EuroOptic</h2>
            <p className="mt-5 leading-8 text-slate-300">Looking for something else? Open EuroOptic&apos;s main storefront through the WASCIK affiliate link and explore its current catalog.</p>
            <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-cyan-400 px-7 py-4 text-center font-black text-cyan-100 transition hover:bg-cyan-500/10">Browse EuroOptic →</a>
          </article>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through the EuroOptic links on this page, at no additional cost to you. Prices, availability, specifications, and promotions may change. Please confirm all current product details with EuroOptic before purchasing.</p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-emerald-950 bg-[#010504] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · EuroOptic partner page.</footer>
    </main>
  );
}
