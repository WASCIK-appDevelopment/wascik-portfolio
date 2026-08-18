import Image from "next/image";
import Link from "next/link";
import PublishedAffiliateProducts from "../PublishedAffiliateProducts";

const storeLink = "https://aquacurve.sjv.io/c/7587435/3859681/51362?trafsrc=impact";

const collections = [
  {
    title: "Armrest Loungers & Side Tables",
    image: "/affiliate/aquacurve/aquacurve-armrest-lounger.webp",
    description: "Create a comfortable shallow-water setup with supportive armrests, cup-holder convenience, and a matching table for poolside essentials.",
  },
  {
    title: "Folding In-Pool Loungers",
    image: "/affiliate/aquacurve/aquacurve-folding-lounger.webp",
    description: "Space-conscious folding loungers bring full-body support to tanning ledges and can fold flatter for storage between pool days.",
  },
  {
    title: "Teak-Look Lounger Sets",
    image: "/affiliate/aquacurve/aquacurve-teak-lounger-set.webp",
    description: "Warm wood-look finishes and matching tables add a resort-inspired feel to shallow-water lounging areas and backyard pools.",
  },
  {
    title: "Colorful Sun-Shelf Seating",
    image: "/affiliate/aquacurve/aquacurve-sun-shelf-chair.webp",
    description: "Bright sun-shelf chairs offer a relaxed way to stretch out, socialize, and coordinate furniture with your outdoor space.",
  },
];

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
      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-cyan-300">WASCIK Featured Outdoor-Living Partner</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">Relax into<br /><span className="text-cyan-300">AquaCurve.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Explore AquaCurve in-pool loungers, sun-shelf chairs, side tables, and coordinated furniture designed to elevate backyard and hospitality pool spaces.</p>
            <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-9 inline-flex min-h-14 items-center justify-center rounded-xl bg-cyan-300 px-8 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-200">Shop AquaCurve →</a>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-cyan-300/30 bg-white shadow-[0_30px_100px_rgba(0,0,0,.4)]">
            <Image src="/affiliate/aquacurve/aquacurve-teak-lounger-set.webp" alt="AquaCurve teak-look in-pool loungers and matching side table" width={1200} height={900} className="h-auto w-full object-cover" priority />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-cyan-950 bg-[#061d23]/80 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-cyan-300">Poolside furniture inspiration</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">Build your favorite place to unwind</h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">Browse a few styles currently represented in AquaCurve&apos;s outdoor-living collection. Use any button below to open the main store through the WASCIK affiliate link.</p>
          <div className="mt-10 grid gap-7 md:grid-cols-2">
            {collections.map((collection) => (
              <article key={collection.title} className="flex h-full flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#031216] shadow-[0_22px_60px_rgba(0,0,0,.28)]">
                <Image src={collection.image} alt={collection.title} width={1200} height={900} className="aspect-[4/3] h-auto w-full object-cover" />
                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  <h3 className="text-2xl font-black">{collection.title}</h3>
                  <p className="mt-4 leading-7 text-slate-300">{collection.description}</p>
                  <div className="mt-auto pt-7"><a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-cyan-300 px-5 py-3 text-center font-black text-cyan-100 transition hover:bg-cyan-300/10">Explore AquaCurve →</a></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublishedAffiliateProducts pagePath="/affiliate-services/aquacurve" />
      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through the AquaCurve links on this page, at no additional cost to you. Product selection, prices, colors, specifications, promotions, and availability may change. Confirm current details with AquaCurve before purchasing.</p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl text-center"><a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-cyan-300 px-8 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-200 sm:w-auto">Visit the AquaCurve Main Store ↗</a></div>
      </section>
      <footer className="relative z-10 border-t border-cyan-950 bg-[#010709] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</footer>
    </main>
  );
}
