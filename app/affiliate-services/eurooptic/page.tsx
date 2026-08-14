import Image from "next/image";
import Link from "next/link";

const watchLink = "https://eurooptic.sjv.io/WOEqjX";
const storeLink = "https://eurooptic.sjv.io/c/7587435/2973190/35464";

const outdoorProducts = [
  {
    name: "Garmin inReach Mini 2 GPS Satellite Communicator",
    category: "Satellite communication & navigation",
    image: "/affiliate/eurooptic/products/garmin-inreach-mini-2.webp",
    link: "https://eurooptic.sjv.io/JkZoPe",
    description: "A compact black GPS satellite communicator designed for off-grid trips, route awareness, and staying connected beyond normal cellular coverage.",
    features: ["Compact handheld design", "GPS navigation support", "Satellite communication capabilities"],
    note: "Some satellite communication and safety features may require activation, a compatible device, and a paid service plan.",
  },
  {
    name: "Fujinon Polaris 7x50 FMTR-SX2 Waterproof Binoculars",
    category: "Optics & outdoor observation",
    image: "/affiliate/eurooptic/products/fujinon-polaris-binoculars.webp",
    link: "https://eurooptic.sjv.io/4aMR9L",
    description: "Rugged waterproof binoculars built for detailed outdoor and marine observation with multicoated optics, a rubberized body, and field-flattener lenses.",
    features: ["Waterproof construction", "Multicoated optical system", "Rubberized body and field-flattener lenses"],
    note: "Confirm the current model number, magnification, included accessories, and full specifications on EuroOptic before purchasing.",
  },
  {
    name: "Leofoto PC-20 Blue Mobile Phone Stand",
    category: "Mobile photography accessory",
    image: "/affiliate/eurooptic/products/leofoto-pc20-phone-stand.webp",
    link: "https://eurooptic.sjv.io/Ag5k7K",
    description: "A compact blue mobile-phone stand designed for convenient tabletop positioning and easy attachment to compatible photography support equipment.",
    features: ["Compact folding design", "Blue metal construction", '1/4-inch mounting sockets'],
    note: "Confirm phone compatibility, included accessories, mounting options, and current specifications on EuroOptic before purchasing.",
  },
  {
    name: "Garmin Instinct 3 45mm Solar Tactical Edition Smartwatch",
    category: "Outdoor technology & tactical wearables",
    image: "/affiliate/eurooptic/products/garmin-instinct-3-solar-tactical.webp",
    link: "https://eurooptic.sjv.io/3kzXgr",
    description: "A rugged black 45mm GPS smartwatch with solar charging support and tactical-focused features for outdoor training, navigation, and everyday activity tracking.",
    features: ["Solar charging support", "Rugged 45mm GPS watch design", "Tactical-edition activity and navigation features"],
    note: "Battery performance varies by use and solar exposure. Confirm compatibility, feature availability, and current specifications with EuroOptic.",
  },
  {
    name: "Oakley Meta Vanguard White Prizm Black Shield Sunglasses",
    category: "Smart eyewear & performance sunglasses",
    image: "/affiliate/eurooptic/products/oakley-meta-vanguard-white.webp",
    link: "https://eurooptic.sjv.io/vDm1A3",
    description: "Performance-focused Oakley Meta smart eyewear in white with a Prizm Black shield lens and a streamlined semi-rimless wraparound design.",
    features: ["Oakley Meta smart-eyewear platform", "Prizm Black shield lens", "Lightweight semi-rimless performance frame"],
    note: "Confirm device compatibility, connected-feature availability, fit, included accessories, and current specifications with EuroOptic before purchasing.",
  },
  {
    name: "Ray-Ban Meta Skyler Shiny Chalky Gray Transitions Sapphire Sunglasses",
    category: "Smart eyewear & transition lenses",
    image: "/affiliate/eurooptic/products/ray-ban-meta-skyler-chalky-gray.webp",
    link: "https://eurooptic.sjv.io/oNJP1W",
    description: "Ray-Ban Meta Skyler smart glasses in a shiny chalky-gray frame with Transitions Sapphire lenses that adapt as lighting conditions change.",
    features: ["Ray-Ban Meta smart-eyewear platform", "Transitions Sapphire lenses", "Rounded Skyler frame in shiny chalky gray"],
    note: "Confirm connected-feature availability, device compatibility, lens options, fit, included accessories, and current specifications with EuroOptic before purchasing.",
  },
  {
    name: "Oakley Holbrook Matte Black PRIZM Dark Golf Sunglasses",
    category: "Performance eyewear & golf lenses",
    image: "/affiliate/eurooptic/products/oakley-holbrook-prizm-dark-golf.webp",
    link: "https://eurooptic.sjv.io/B5kerJ",
    description: "Oakley Holbrook sunglasses with a matte-black frame and PRIZM Dark Golf lenses designed to enhance contrast and visual detail on the course.",
    features: ["PRIZM Dark Golf lenses", "Classic Holbrook frame", "Matte-black finish"],
    note: "Confirm lens transmission, fit, included accessories, and current specifications with EuroOptic before purchasing.",
  },
];

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
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.3em] text-emerald-300">WASCIK Featured Retail Partner</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl">Explore<br /><span className="text-emerald-400">EuroOptic.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Shop optics, outdoor equipment, watches, and other specialty gear through WASCIK&apos;s tracked EuroOptic links.</p>
            <div className="mt-9">
              <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-200">Shop the EuroOptic Store ↗</a>
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
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
              <Image
                src="/affiliate/eurooptic/garmin-quatix-8-pro-front.svg"
                alt="Front view of the Garmin Quatix 8 Pro smartwatch with Captain Blue silicone band"
                width={650}
                height={650}
                className="h-auto w-full rounded-2xl border border-white/10 bg-white object-contain"
              />
              <Image
                src="/affiliate/eurooptic/garmin-quatix-8-pro-angle.svg"
                alt="Angled view of the Garmin Quatix 8 Pro smartwatch with Captain Blue silicone band"
                width={634}
                height={634}
                className="h-auto w-full rounded-2xl border border-white/10 bg-white object-contain"
              />
            </div>
          </article>
          <article className="rounded-3xl border border-cyan-500/25 bg-cyan-500/[.06] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.26em] text-cyan-300">Browse more</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Visit EuroOptic</h2>
            <p className="mt-5 leading-8 text-slate-300">Looking for something else? Open EuroOptic&apos;s main storefront through the WASCIK affiliate link and explore its current catalog.</p>
            <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-cyan-400 px-7 py-4 text-center font-black text-cyan-100 transition hover:bg-cyan-500/10">Browse EuroOptic →</a>
          </article>
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-emerald-300">Outdoor technology &amp; optics</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">Featured EuroOptic gear</h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">Explore navigation, satellite communication, outdoor optics, and performance eyewear through WASCIK&apos;s tracked EuroOptic links.</p>
          <div className="mt-10 grid gap-7 lg:grid-cols-2">
            {outdoorProducts.map((product) => (
              <article key={product.name} className="flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0b231d] to-[#030b09] shadow-[0_24px_70px_rgba(0,0,0,.32)]">
                <div className="bg-white p-4"><Image src={product.image} alt={product.name} width={1200} height={800} className="aspect-[3/2] h-auto w-full object-contain" /></div>
                <div className="flex flex-1 flex-col p-7 sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[.22em] text-emerald-300">{product.category}</p>
                  <h3 className="mt-3 text-3xl font-black leading-tight">{product.name}</h3>
                  <p className="mt-4 leading-7 text-slate-300">{product.description}</p>
                  <ul className="mt-5 grid gap-2 text-sm text-slate-200">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                  <p className="mt-5 text-sm leading-6 text-slate-400">{product.note}</p>
                  <div className="mt-auto pt-7"><a href={product.link} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-emerald-200">View Product →</a><p className="mt-3 text-center text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through the EuroOptic links on this page, at no additional cost to you. Prices, availability, specifications, and promotions may change. Please confirm all current product details with EuroOptic before purchasing.</p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl text-center">
          <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-emerald-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-200 sm:w-auto">Shop the EuroOptic Store ↗</a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-emerald-950 bg-[#010504] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · EuroOptic partner page.</footer>
    </main>
  );
}
