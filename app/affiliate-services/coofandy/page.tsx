import Image from "next/image";
import Link from "next/link";
import PublishedAffiliateProducts from "../PublishedAffiliateProducts";

export default function CoofandyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080706] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_18%_14%,rgba(217,119,6,.20),transparent_30%),radial-gradient(circle_at_86%_58%,rgba(120,53,15,.18),transparent_28%)]" />

      <header className="relative z-10 border-b border-amber-950 bg-[#080706]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3">
            <Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.15em] text-amber-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services" className="rounded-lg border border-amber-600/70 px-4 py-2 text-sm font-bold text-amber-100">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.3em] text-amber-300">WASCIK Featured Fashion Partner</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[.9] tracking-[-.05em] sm:text-7xl">Dress with<br /><span className="text-amber-400">COOFANDY.</span></h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">Explore men&apos;s suits, shirts, jackets, casual clothing, and seasonal fashion selected and organized through WASCIK Affiliate Services.</p>
        </div>
      </section>

      <section className="relative z-10 border-y border-amber-950 bg-[#160f08]/80 px-5 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["Suits & formalwear", "Shirts & business casual", "Jackets & outerwear", "Everyday men’s fashion"].map((category) => (
            <article key={category} className="rounded-2xl border border-amber-700/40 bg-[#211408] p-6">
              <p className="font-black text-amber-200">{category}</p>
              <p className="mt-3 leading-7 text-slate-400">Approved COOFANDY products in this category will be organized here as they are published from the private console.</p>
            </article>
          ))}
        </div>
      </section>

      <PublishedAffiliateProducts pagePath="/affiliate-services/coofandy" />

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through COOFANDY links on this page, at no additional cost to you. Prices, sizing, availability, materials, shipping, and promotions may change. Confirm current details with the merchant before purchasing.</p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-amber-950 bg-[#040302] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</footer>
    </main>
  );
}
