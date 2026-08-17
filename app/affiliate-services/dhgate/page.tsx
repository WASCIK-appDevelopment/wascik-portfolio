import Image from "next/image";
import Link from "next/link";
import { affiliateProducts } from "../products";
import PublishedAffiliateProducts, { affiliateProductCategoryOrder } from "../PublishedAffiliateProducts";

const products = affiliateProducts.filter((product) => product.merchant === "DHgate");

export default function DHgatePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050811] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_18%_14%,rgba(220,38,38,.18),transparent_30%),radial-gradient(circle_at_86%_58%,rgba(37,99,235,.16),transparent_28%)]" />

      <header className="relative z-10 border-b border-red-950 bg-[#050811]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3">
            <Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.15em] text-red-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services" className="rounded-lg border border-red-600/70 px-4 py-2 text-sm font-bold text-red-100">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.3em] text-red-300">WASCIK Global Marketplace Picks</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[.9] tracking-[-.05em] sm:text-7xl">Discover more on<br /><span className="text-red-400">DHgate.</span></h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">Explore selected electronics, creator tools, travel gear, accessories, and useful everyday products through tracked WASCIK affiliate links.</p>
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-red-300">Current featured products</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">DHgate product picks</h2>
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} style={{ order: affiliateProductCategoryOrder(product.category) }} className="flex h-full flex-col overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#241016] to-[#070a12]">
                <div className="grid min-h-56 place-items-center bg-white p-4">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="max-h-56 w-full object-contain" /> : <div className="grid h-28 w-28 place-items-center rounded-3xl bg-slate-900 text-3xl font-black text-red-300">DH</div>}
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-xs font-black uppercase tracking-[.2em] text-red-300">{product.category}</p>
                  <h3 className="mt-3 text-2xl font-black leading-tight">{product.title}</h3>
                  <p className="mt-4 leading-7 text-slate-300">{product.description}</p>
                  <ul className="mt-5 grid gap-2 text-sm text-slate-200">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                  <div className="mt-auto pt-7">
                    {product.id === 1 && <Link href="/affiliate-services/dhgate/portable-voice-recorder" className="mb-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-red-400 px-5 py-3 text-center font-black text-red-100">Full Product Details →</Link>}
                    <a href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-400 px-5 py-3 text-center font-black text-slate-950">View Product →</a>
                    <p className="mt-3 text-center text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublishedAffiliateProducts pagePath="/affiliate-services/dhgate" />

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through DHgate links on this page, at no additional cost to you. Prices, availability, specifications, shipping, and promotions may change. Confirm current details with the merchant before purchasing.</p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-red-950 bg-[#020306] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</footer>
    </main>
  );
}
