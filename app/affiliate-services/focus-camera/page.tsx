import Image from "next/image";
import Link from "next/link";

const productLink = "https://focuscamera.pxi6.net/3kzXRX";

export default function FocusCameraPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_18%_15%,rgba(37,99,235,.22),transparent_30%),radial-gradient(circle_at_88%_62%,rgba(14,165,233,.14),transparent_28%)]" />

      <header className="relative z-10 border-b border-blue-950 bg-[#080b12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3">
            <Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.15em] text-blue-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services" className="rounded-lg border border-blue-600/70 px-4 py-2 text-sm font-bold text-blue-100 transition hover:border-blue-300">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.3em] text-blue-300">Focus Camera &amp; Lifestyle by Focus</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[.9] tracking-[-.05em] sm:text-7xl">Technology for<br /><span className="text-blue-400">life on the move.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Explore featured navigation, camera, electronics, and lifestyle products through WASCIK&apos;s tracked Focus Camera links.</p>
        </div>
      </section>

      <section className="relative z-10 border-y border-blue-950 bg-[#0b1424]/85 px-5 py-16 md:px-8">
        <article className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-blue-500/35 bg-gradient-to-br from-[#10203b] to-[#070b13] shadow-[0_30px_90px_rgba(0,0,0,.4)] lg:grid-cols-[1fr_1fr]">
          <div className="flex items-center justify-center bg-white p-5 sm:p-8">
            <Image src="/affiliate/focus-camera/garmin-dezlcam-otr725.webp" alt="Garmin dezlCam OTR725 seven-inch GPS truck navigator with built-in dash camera" width={1100} height={700} className="h-auto w-full object-contain" priority />
          </div>
          <div className="flex flex-col p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.26em] text-blue-300">Featured navigation technology</p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Garmin dezlCam OTR725</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">A 7-inch GPS truck navigator combining a large touchscreen display with a built-in dash camera for professional drivers and life on the road.</p>
            <ul className="mt-7 grid gap-3 text-slate-200">
              <li>✓ 7-inch touchscreen navigation display</li>
              <li>✓ Built-in dash camera</li>
              <li>✓ Designed for truck navigation</li>
            </ul>
            <div className="mt-auto pt-9">
              <a href={productLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-400 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-300">View at Focus Camera →</a>
              <p className="mt-4 text-sm leading-6 text-slate-400">Check the merchant&apos;s current listing for price, availability, specifications, shipping, and return terms.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through Focus Camera links on this page, at no additional cost to you. Product prices, availability, specifications, and promotions may change.</p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-blue-950 bg-[#04060a] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · Focus Camera partner page.</footer>
    </main>
  );
}
