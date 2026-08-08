import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    title: "Tech & Electronics",
    copy: "Computers, accessories, gadgets, audio-visual gear, software, and other useful technology selected for practical value.",
    icon: "⌁",
  },
  {
    title: "Home & DIY",
    copy: "Home, garden, do-it-yourself, office, and everyday products that help people work smarter and improve their space.",
    icon: "⌂",
  },
  {
    title: "Health & Fitness",
    copy: "Sports equipment, sportswear, wellness, and health-focused products evaluated with usefulness and value in mind.",
    icon: "+",
  },
  {
    title: "Style & Everyday",
    copy: "Clothing, shoes, accessories, books, subscriptions, and other consumer products worth discovering.",
    icon: "◇",
  },
];

const process = [
  ["01", "Research", "We examine products, services, features, pricing, and who each option is actually best suited for."],
  ["02", "Compare", "We organize the important differences so visitors can make a more informed decision without unnecessary hype."],
  ["03", "Recommend", "When a product earns a place in our content, we explain why and provide a clearly disclosed affiliate link when available."],
  ["04", "Improve", "We study what readers find useful and continuously improve our guides, comparisons, and digital tools."],
];

export default function AffiliateServicesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020913] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,174,255,.18),transparent_26%),radial-gradient(circle_at_85%_60%,rgba(0,126,196,.13),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-20 [background-image:linear-gradient(rgba(22,143,199,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(22,143,199,.28)_1px,transparent_1px)] [background-size:46px_46px]" />

      <header className="relative z-10 border-b border-sky-900/70 bg-[#020913]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="WASCIK home">
            <Image src="/wascik-logo-v2.png" alt="WASCIK" width={1812} height={868} className="h-auto w-32 drop-shadow-[0_0_14px_rgba(0,153,230,.65)] sm:w-40" priority />
          </Link>
          <nav className="flex items-center gap-3 text-sm font-bold text-sky-100 sm:gap-6" aria-label="Affiliate services navigation">
            <a href="#how-it-works" className="hidden hover:text-yellow-300 sm:inline">How it works</a>
            <a href="#categories" className="hidden hover:text-yellow-300 sm:inline">Categories</a>
            <Link href="/" className="rounded-lg border border-sky-600/70 px-3 py-2 hover:border-yellow-300 hover:text-yellow-300">WASCIK Home</Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:py-28">
        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[.28em] text-sky-300">WASCIK Affiliate Services</p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[.92] tracking-[-.05em] sm:text-6xl lg:text-7xl">
            Discover smarter.<br />
            <span className="text-sky-400">Choose with confidence.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Original reviews, comparisons, educational content, videos, and buying guides designed to help people find useful products and services without the noise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#categories" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-yellow-300 px-6 py-3 font-black text-slate-950 shadow-[0_0_28px_rgba(255,230,0,.24)] transition hover:-translate-y-0.5 hover:bg-yellow-200">Explore Categories</a>
            <a href="#disclosure" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-700 bg-sky-950/50 px-6 py-3 font-bold text-white transition hover:border-sky-400">Our Affiliate Policy</a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-sky-200">
            <span>✓ Original content</span><span>✓ Clear comparisons</span><span>✓ Transparent disclosures</span>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-[#09283b] to-[#03101b] p-7 shadow-[0_25px_80px_rgba(0,0,0,.55),0_0_42px_rgba(0,142,212,.20)] sm:p-9">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18px_18px,#72dcff_0_2px,transparent_3px)] [background-size:70px_70px]" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400 bg-sky-900/70 text-xl font-black text-yellow-300 shadow-[0_0_25px_rgba(0,190,255,.25)]">AI</span>
            <p className="mt-6 text-xs font-black uppercase tracking-[.24em] text-sky-300">Built for better decisions</p>
            <h2 className="mt-3 text-3xl font-black">Research first. Recommend second.</h2>
            <p className="mt-4 leading-7 text-slate-300">WASCIK Affiliate Services is being built around useful research and honest recommendations. AI may assist our research and content workflow, but every recommendation is designed to be understandable to real people.</p>
            <div className="mt-7 rounded-xl border border-sky-700/50 bg-[#020913]/60 p-4 text-sm leading-6 text-slate-300">
              <strong className="text-white">Affiliate partnerships are launching.</strong><br />Our recommendation library will expand as approved merchant partnerships become available.
            </div>
          </div>
        </aside>
      </section>

      <section id="how-it-works" className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/85 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">How it works</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">A straightforward path from research to recommendation.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-sky-800/70 bg-[#061b2a]/90 p-6">
                <span className="text-sm font-black text-yellow-300">{number}</span>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
        <p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">What we cover</p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-4xl font-black sm:text-5xl">Useful products across everyday life and technology.</h2>
          <p className="max-w-md text-sm leading-6 text-slate-400">Our coverage will grow over time. We only add categories and partnerships that fit the content we actually create.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <article key={category.title} className="group relative overflow-hidden rounded-2xl border border-sky-800/70 bg-gradient-to-br from-[#09283b] to-[#03101b] p-7 transition hover:-translate-y-1 hover:border-sky-400">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl transition group-hover:bg-sky-400/20" />
              <span className="relative inline-grid h-12 w-12 place-items-center rounded-xl border border-sky-500/60 bg-sky-950 text-2xl font-black text-yellow-300">{category.icon}</span>
              <h3 className="relative mt-5 text-2xl font-black">{category.title}</h3>
              <p className="relative mt-3 max-w-xl leading-7 text-slate-300">{category.copy}</p>
              <span className="relative mt-5 inline-block text-sm font-bold text-sky-300">Recommendations coming soon →</span>
            </article>
          ))}
        </div>
      </section>

      <section id="disclosure" className="relative z-10 px-5 pb-20 md:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-yellow-300/30 bg-yellow-300/[.06] p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.26em] text-yellow-300">Transparency matters</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Affiliate Disclosure</h2>
          <p className="mt-5 max-w-4xl leading-8 text-slate-300">
            Some links on WASCIK Affiliate Services may be affiliate links. If you click one of those links and make a qualifying purchase, WASCIK may earn a commission from the merchant at no additional cost to you. Compensation does not change our commitment to clear, useful content and transparent recommendations.
          </p>
        </div>
      </section>

      <section className="relative z-10 border-t border-sky-900/70 bg-[#03101a] px-5 py-16 text-center md:px-8">
        <p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">WASCIK Affiliate Services</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black sm:text-4xl">Better research. Clearer choices. Smarter digital discovery.</h2>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-600 px-6 py-3 font-bold text-white hover:border-yellow-300 hover:text-yellow-300">Back to WASCIK App Development</Link>
      </section>

      <footer className="relative z-10 border-t border-sky-950 bg-[#01070d] px-5 py-7 text-center text-sm text-slate-500">
        © 2026 WASCIK Affiliate Services · A WASCIK digital project.
      </footer>
    </main>
  );
}
