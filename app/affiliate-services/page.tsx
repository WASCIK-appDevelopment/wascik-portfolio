import Image from "next/image";
import Link from "next/link";
import { affiliateProducts, merchantOrder } from "./products";

const merchantMeta = {
  DHgate: {
    kicker: "Tech & everyday gadgets",
    copy: "Compact technology, creator tools, travel gear, and practical accessories selected for useful everyday applications.",
    mark: "DH",
  },
  Philips: {
    kicker: "Smart home & security",
    copy: "Video doorbells and smart locks focused on practical entry control, front-door awareness, and connected-home convenience.",
    mark: "PH",
  },
  RevoMatic: {
    kicker: "Fitness, recovery & beauty tech",
    copy: "Massage, recovery, skincare, and home-fitness products designed for convenient at-home routines.",
    mark: "RE",
  },
};

function ProductCard({ product }: { product: (typeof affiliateProducts)[number] }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sky-800/70 bg-gradient-to-br from-[#09283b] to-[#03101b] shadow-[0_20px_55px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-sky-400/80">
      <div className="relative grid min-h-52 place-items-center overflow-hidden border-b border-sky-800/60 bg-[radial-gradient(circle_at_50%_45%,rgba(32,190,255,.20),transparent_34%),linear-gradient(135deg,#071e2e,#03101a)] p-6">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(72,198,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(72,198,255,.16)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-sky-400/50 bg-sky-950/80 text-3xl font-black tracking-[-.06em] text-yellow-300 shadow-[0_0_36px_rgba(0,177,255,.18)]">
          {merchantMeta[product.merchant].mark}
        </div>
        <span className="absolute left-5 top-5 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-yellow-200">
          {product.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-sky-300">{product.category}</p>
        <h3 className="mt-3 text-2xl font-black leading-tight text-white">{product.title}</h3>
        {product.note ? <p className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-yellow-200/80">{product.note}</p> : null}
        <p className="mt-4 leading-7 text-slate-300">{product.description}</p>

        <ul className="mt-5 grid gap-2 text-sm text-slate-200">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="mt-1 text-sky-300">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-yellow-200"
          >
            View Product →
          </a>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p>
        </div>
      </div>
    </article>
  );
}

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
            <a href="#products" className="hidden hover:text-yellow-300 sm:inline">Products</a>
            <a href="#disclosure" className="hidden hover:text-yellow-300 sm:inline">Disclosure</a>
            <Link href="/" className="rounded-lg border border-sky-600/70 px-3 py-2 hover:border-yellow-300 hover:text-yellow-300">WASCIK Home</Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:py-24">
        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[.28em] text-sky-300">WASCIK Affiliate Services</p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[.92] tracking-[-.05em] sm:text-6xl lg:text-7xl">
            Products worth<br />
            <span className="text-sky-400">a closer look.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Research-backed product picks across technology, smart-home security, fitness, recovery, and beauty tech. Every product below links directly through an affiliate partnership.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-yellow-300 px-6 py-3 font-black text-slate-950 shadow-[0_0_28px_rgba(255,230,0,.24)] transition hover:-translate-y-0.5 hover:bg-yellow-200">Browse Products</a>
            <a href="#disclosure" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-700 bg-sky-950/50 px-6 py-3 font-bold text-white transition hover:border-sky-400">Affiliate Disclosure</a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-sky-200">
            <span>✓ 18 researched products</span><span>✓ 3 merchant partners</span><span>✓ Transparent affiliate links</span>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-[#09283b] to-[#03101b] p-7 shadow-[0_25px_80px_rgba(0,0,0,.55),0_0_42px_rgba(0,142,212,.20)] sm:p-9">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_18px_18px,#72dcff_0_2px,transparent_3px)] [background-size:70px_70px]" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400 bg-sky-900/70 text-xl font-black text-yellow-300 shadow-[0_0_25px_rgba(0,190,255,.25)]">AI</span>
            <p className="mt-6 text-xs font-black uppercase tracking-[.24em] text-sky-300">Research before recommendation</p>
            <h2 className="mt-3 text-3xl font-black">Useful information without the hard sell.</h2>
            <p className="mt-4 leading-7 text-slate-300">We organize product features, use cases, and limitations so visitors can decide whether an item actually fits what they need.</p>
            <div className="mt-7 rounded-xl border border-yellow-300/25 bg-yellow-300/[.06] p-4 text-sm leading-6 text-slate-300">
              <strong className="text-yellow-200">A quick note:</strong><br />We do not claim personal hands-on testing unless we have actually used the product ourselves.
            </div>
          </div>
        </aside>
      </section>

      <section className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/85 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <span className="mr-2 text-xs font-black uppercase tracking-[.2em] text-slate-500">Jump to</span>
          {merchantOrder.map((merchant) => (
            <a key={merchant} href={`#${merchant.toLowerCase()}`} className="rounded-full border border-sky-800 bg-sky-950/60 px-4 py-2 text-sm font-bold text-sky-100 transition hover:border-yellow-300 hover:text-yellow-200">
              {merchant}
            </a>
          ))}
        </div>
      </section>

      <div id="products" className="relative z-10">
        {merchantOrder.map((merchant, merchantIndex) => {
          const products = affiliateProducts.filter((product) => product.merchant === merchant);
          const meta = merchantMeta[merchant];

          return (
            <section key={merchant} id={merchant.toLowerCase()} className={`px-5 py-20 md:px-8 lg:py-24 ${merchantIndex % 2 === 1 ? "border-y border-sky-900/60 bg-[#04121e]/55" : ""}`}>
              <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">{meta.kicker}</p>
                    <h2 className="mt-3 text-4xl font-black sm:text-5xl">{merchant}</h2>
                    <p className="mt-4 max-w-3xl leading-7 text-slate-300">{meta.copy}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-500">{products.length} products</span>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section id="disclosure" className="relative z-10 px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-yellow-300/30 bg-yellow-300/[.06] p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.26em] text-yellow-300">Transparency matters</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Affiliate Disclosure</h2>
          <p className="mt-5 max-w-4xl leading-8 text-slate-300">
            Links marked as product links on WASCIK Affiliate Services may be affiliate links. If you click one and make a qualifying purchase, WASCIK may earn a commission from the merchant at no additional cost to you. Product prices, availability, specifications, and promotions can change after publication, so always review the merchant&apos;s current listing before purchasing.
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
