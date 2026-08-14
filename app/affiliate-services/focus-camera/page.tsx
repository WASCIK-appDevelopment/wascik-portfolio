import Image from "next/image";
import Link from "next/link";

const productLink = "https://focuscamera.pxi6.net/3kzXRX";
const storeLink = "https://focuscamera.pxi6.net/c/7587435/642856/10228";

const featuredProducts = [
  {
    name: "Poseidon Nano 3000mAh Wireless Charger",
    group: "Lifestyle & everyday essentials",
    category: "Portable power",
    image: "/affiliate/focus-camera/products/poseidon-nano-charger.webp",
    link: "https://focuscamera.pxi6.net/Ag5kVR",
    description: "A compact 3000mAh wireless charging solution built for convenient backup power without adding a bulky full-size battery pack to your everyday carry.",
    features: ["Compact portable design", "3000mAh power capacity", "Built-in Mavrik charging technology"],
  },
  {
    name: "eMeet C980 Pro Full HD Webcam",
    group: "Computing & personal technology",
    category: "Work & video calls",
    image: "/affiliate/focus-camera/products/emee-c980-pro-webcam.webp",
    link: "https://focuscamera.pxi6.net/aNDYVj",
    description: "An all-in-one Full HD webcam designed to simplify meetings, remote work, classes, and everyday video calls with integrated audio hardware.",
    features: ["Full HD video", "Noise-reduction microphone", "Built-in speakers"],
  },
  {
    name: "Zoom ZDM-1 Four-Person Podcast Bundle",
    group: "Music, podcasting & studio audio",
    category: "Podcast & creator gear",
    image: "/affiliate/focus-camera/products/zoom-zdm1-podcast-bundle.webp",
    link: "https://focuscamera.pxi6.net/X4Eoj5",
    description: "A coordinated four-person podcast setup that brings together microphone-and-headphone packs with four adjustable boom arms for a cleaner shared recording space.",
    features: ["Four podcast mic packs", "Headphones included", "Four adjustable boom arms"],
  },
  {
    name: "Dell UltraSharp 27-inch 4K UHD Monitor",
    group: "Computing & personal technology",
    category: "Computers & displays",
    image: "/affiliate/focus-camera/products/dell-ultrasharp-27-monitor.webp",
    link: "https://focuscamera.pxi6.net/xJoXKk",
    description: "A sharp 27-inch 4K display for detailed creative work, productivity, media, and multi-device desk setups in a clean black-and-silver design.",
    features: ["27-inch 4K UHD display", "DisplayPort, USB, and HDMI connectivity", "Productivity-focused UltraSharp design"],
  },
  {
    name: "DJI Flip Fly More Combo Camera Drone",
    group: "Cameras, lighting & imaging",
    category: "Camera & drone technology",
    image: "/affiliate/focus-camera/products/dji-flip-fly-more-combo.webp",
    link: "https://focuscamera.pxi6.net/k4AQKM",
    description: "A complete compact camera-drone package with the DJI RC 2 controller, extra batteries, charging hub, protective components, and a carrying bag for travel-ready aerial content creation.",
    features: ["DJI RC 2 controller", "Extra batteries and charging hub", "Carrying bag and Fly More accessories"],
  },
  {
    name: "Outdoor Survival Bracelet & Lifestyle Gear",
    group: "Lifestyle & everyday essentials",
    category: "Explore the main store",
    image: "/affiliate/focus-camera/products/outdoor-survival-bracelet.webp",
    link: storeLink,
    description: "Explore Focus Camera & Lifestyle for practical outdoor accessories such as this multi-function paracord bracelet, along with cameras, electronics, travel gear, and other current store selections.",
    features: ["Multi-function outdoor accessory", "Paracord bracelet design", "Links to the full Focus Camera catalog"],
  },
  {
    name: "Beats Solo 4 Bluetooth On-Ear Headphones (Refurbished)",
    group: "Computing & personal technology",
    category: "Wireless audio",
    image: "/affiliate/focus-camera/products/beats-solo-4-refurbished.webp",
    link: "https://focuscamera.pxi6.net/0GzXqY",
    description: "Refurbished matte-black Beats Solo 4 on-ear headphones for wireless everyday listening, travel, calls, and compact personal audio.",
    features: ["Bluetooth wireless listening", "Built-in digital-to-analog converter", "Refurbished matte-black finish"],
  },
  {
    name: "Apple 11-inch iPad with A16 Chip, 128GB Wi-Fi",
    group: "Computing & personal technology",
    category: "Tablets & mobile technology",
    image: "/affiliate/focus-camera/products/apple-ipad-11-a16.webp",
    link: "https://focuscamera.pxi6.net/OYEoqK",
    description: "A silver 11-inch Wi-Fi iPad pairing Apple&apos;s A16 chip with 128GB of storage for browsing, streaming, creative work, communication, and everyday mobile productivity.",
    features: ["11-inch display", "Apple A16 chip", "128GB Wi-Fi configuration"],
  },
  {
    name: "Alesis Nitro Ultimate 9-Piece Professional Electronic Drum Kit",
    group: "Music, podcasting & studio audio",
    category: "Electronic instruments",
    image: "/affiliate/focus-camera/products/alesis-nitro-ultimate-drum-kit.webp",
    link: "https://focuscamera.pxi6.net/xJoXxR",
    description: "A nine-piece electronic drum system with a complete rack-mounted pad layout, cymbal pads, drum module, Bluetooth support, and kick-pedal setup for practice, recording, and performance.",
    features: ["Nine-piece electronic drum configuration", "Bluetooth-equipped drum module", "Rack, cymbal pads, and kick-pedal system"],
  },
  {
    name: "OutIn Fino Portable Electric Coffee Grinder",
    group: "Lifestyle & everyday essentials",
    category: "Coffee & travel accessories",
    image: "/affiliate/focus-camera/products/outin-fino-coffee-grinder.webp",
    link: "https://focuscamera.pxi6.net/c/7587435/3759881/10228?prodsku=50543834202407&u=https%3A%2F%2Flifestylebyfocus.com%2Fproducts%2Foutin-fino-gr-sw-coffee-espresso-tea-coffee-accessories-tools&intsrc=APIG_30377",
    description: "A compact Sandstone White electric coffee grinder built for home or travel, with adjustable settings for dialing in grounds for different brewing methods.",
    features: ["28 grind-size settings", "Portable electric design", "Cleaning brush and accessories shown"],
  },
  {
    name: "RØDE NT1 Signature Series Studio Condenser Microphone in Pink",
    group: "Music, podcasting & studio audio",
    category: "Studio microphones",
    image: "/affiliate/focus-camera/products/rode-nt1-signature-pink.webp",
    link: "https://focuscamera.pxi6.net/VOdRrM",
    description: "A pink RØDE NT1 Signature Series studio condenser microphone presented with a shock mount and pop filter for polished vocal, podcast, voice-over, and instrument recording.",
    features: ["Studio condenser microphone", "Shock mount included", "Pop filter included"],
  },
  {
    name: "RØDE NT1 5th Generation Condenser Microphone in Silver",
    group: "Music, podcasting & studio audio",
    category: "Studio microphones",
    image: "/affiliate/focus-camera/products/rode-nt1-5th-generation-silver.webp",
    link: "https://focuscamera.pxi6.net/X4EoPb",
    description: "A silver RØDE NT1 5th Generation condenser microphone package with the SM6 shock mount and pop filter for studio vocals, podcasting, voice-over work, and instruments.",
    features: ["5th Generation NT1 microphone", "SM6 shock mount", "Pop filter included"],
  },
  {
    name: "Vaonis Vespera Pro 2 Smart Telescope",
    group: "Cameras, lighting & imaging",
    category: "Astronomy & astrophotography",
    image: "/affiliate/focus-camera/products/vaonis-vespera-pro-2.webp",
    link: "https://focuscamera.pxi6.net/OYEoXr",
    description: "A compact 12.5MP smart telescope system for guided sky observation and astrophotography, paired with a lightweight tripod for a portable observing setup.",
    features: ["12.5MP imaging system", "Smart astrophotography workflow", "Portable tripod-mounted design"],
  },
  {
    name: "Elinchrom D-Lite RX 4/4 Softbox To Go Kit",
    group: "Cameras, lighting & imaging",
    category: "Studio lighting",
    image: "/affiliate/focus-camera/products/elinchrom-d-lite-rx-4-4-kit.webp",
    link: "https://focuscamera.pxi6.net/R0EYzR",
    description: "A portable two-light studio kit with Elinchrom D-Lite RX 4 heads, softboxes, stands, and carrying cases for portraits, products, and location photography.",
    features: ["Two-light studio setup", "Softboxes and stands included", "Travel cases for location work"],
  },
];

const productGroups = [
  {
    name: "Music, podcasting & studio audio",
    description: "Instruments, microphones, podcast bundles, and recording tools for musicians and creators.",
  },
  {
    name: "Cameras, lighting & imaging",
    description: "Aerial cameras, astrophotography systems, and studio lighting for capturing stronger images.",
  },
  {
    name: "Computing & personal technology",
    description: "Displays, tablets, webcams, headphones, and useful technology for work and entertainment.",
  },
  {
    name: "Lifestyle & everyday essentials",
    description: "Portable power, coffee equipment, outdoor accessories, and practical gear for daily life.",
  },
];

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
          <a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="mt-9 inline-flex min-h-14 items-center justify-center rounded-xl bg-blue-400 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-300">Shop the Focus Camera Main Store →</a>
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

      <section className="relative z-10 px-5 py-20 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-blue-300">Organized Focus Camera picks</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">Shop by what you&apos;re looking for</h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">Products are grouped by use so related equipment stays together. Open each supplied Focus Camera tracking link to confirm current specifications, price, availability, condition, and included accessories.</p>
          <div className="mt-14 space-y-20">
            {productGroups.map((group) => {
              const products = featuredProducts.filter((product) => product.group === group.name);
              return (
                <section key={group.name} aria-labelledby={group.name.replaceAll(" ", "-").toLowerCase()}>
                  <div className="max-w-3xl border-l-4 border-blue-400 pl-5">
                    <h3 id={group.name.replaceAll(" ", "-").toLowerCase()} className="text-3xl font-black sm:text-4xl">{group.name}</h3>
                    <p className="mt-3 leading-7 text-slate-400">{group.description}</p>
                  </div>
                  <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <article key={product.name} className="flex h-full flex-col overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#10203b] to-[#070b13] shadow-[0_24px_70px_rgba(0,0,0,.32)]">
                        <div className="bg-white p-4">
                          <Image src={product.image} alt={product.name} width={1200} height={800} className="aspect-[3/2] h-auto w-full object-contain" />
                        </div>
                        <div className="flex flex-1 flex-col p-7">
                          <p className="text-xs font-black uppercase tracking-[.22em] text-blue-300">{product.category}</p>
                          <h4 className="mt-3 text-2xl font-black leading-tight">{product.name}</h4>
                          <p className="mt-4 leading-7 text-slate-300">{product.description}</p>
                          <ul className="mt-5 grid gap-2 text-sm text-slate-200">
                            {product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                          </ul>
                          <div className="mt-auto pt-7">
                            <a href={product.link} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-blue-300">{product.link === storeLink ? "Explore Focus Camera →" : "View Product →"}</a>
                            <p className="mt-3 text-center text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9">
          <p className="font-black text-yellow-200">Affiliate disclosure</p>
          <p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through Focus Camera links on this page, at no additional cost to you. Product prices, availability, specifications, and promotions may change.</p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl text-center"><a href={storeLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-blue-400 px-7 py-4 text-center font-black text-blue-100 transition hover:bg-blue-500/10 sm:w-auto">Browse All Focus Camera Products →</a></div>
      </section>

      <footer className="relative z-10 border-t border-blue-950 bg-[#04060a] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · Focus Camera partner page.</footer>
    </main>
  );
}
