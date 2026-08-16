import Image from "next/image";
import Link from "next/link";
import { affiliateProducts, merchantOrder } from "./products";
import { suppliedProductImageUrls } from "./revo-image-urls";
import PublishedAffiliateProducts, { affiliateProductCategoryOrder } from "./PublishedAffiliateProducts";

const merchantMeta = {
  DHgate: { kicker: "Tech & everyday gadgets", copy: "Compact technology, creator tools, travel gear, and practical accessories selected for useful everyday applications.", mark: "DH" },
  Philips: { kicker: "Smart home & security", copy: "Video doorbells and smart locks focused on practical entry control, front-door awareness, and connected-home convenience.", mark: "PH" },
  RevoMatic: { kicker: "Fitness, recovery & beauty tech", copy: "Massage, recovery, skincare, and home-fitness products designed for convenient at-home routines.", mark: "RE" },
};

function ProductCard({ product }: { product: (typeof affiliateProducts)[number] }) {
  const productImages = product.id === 1
    ? [
        "/affiliate/dhgate/voice-recorder-gold.webp",
        "/affiliate/dhgate/voice-recorder-black.webp",
        "https://s.alicdn.com/%40sc04/kf/H8f79dd7e50ec417786680eb1d4edbd43H/750mah-Long-Battrey-Life-Sound-Recorder-150-Hours-Working-Slim-Card-Size-Voice-Activated-Recording-Mini-Audio-Recorder-Device.jpg",
      ]
    : product.id === 3
      ? [
          "/affiliate/dhgate/card-reader-black.jpg",
          "/affiliate/dhgate/card-reader-white.jpg",
        ]
      : product.id === 8
        ? [
            "https://images.philips.com/is/image/philipsconsumer/1c278d24487e442f8bbcb1840031ca54?$pnglarge$=&wid=960",
            "https://cdn.shopify.com/s/files/1/0704/9845/1748/files/Voice_guide__To_assist_with_setting_up_your_lock_10.png?v=1753239294",
            "https://mobileimages.lowes.com/productimages/3cb54a9c-87be-40ed-ab95-2b8f7f43b8a8/69389236.jpeg",
          ]
        : product.id === 9
          ? [
              "https://images.philips.com/is/image/philipsconsumer/1c278d24487e442f8bbcb1840031ca54?$pnglarge$=&wid=960",
              "https://cdn.shopify.com/s/files/1/0704/9845/1748/files/Voice_guide__To_assist_with_setting_up_your_lock_10.png?v=1753239294",
              "https://mobileimages.lowes.com/productimages/3cb54a9c-87be-40ed-ab95-2b8f7f43b8a8/69389236.jpeg",
              "https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc4/Philips-5000-series-Smart-Deadbolt.jpg",
            ]
          : suppliedProductImageUrls[product.id]?.length
            ? suppliedProductImageUrls[product.id]
            : product.imageUrl
              ? [product.imageUrl]
              : [];

  return (
    <article style={{ order: affiliateProductCategoryOrder(product.category) }} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sky-800/70 bg-gradient-to-br from-[#09283b] to-[#03101b] shadow-[0_20px_55px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-sky-400/80">
      <div className="relative min-h-64 overflow-hidden border-b border-sky-800/60 bg-[radial-gradient(circle_at_50%_45%,rgba(32,190,255,.20),transparent_34%),linear-gradient(135deg,#071e2e,#03101a)] p-5">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(72,198,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(72,198,255,.16)_1px,transparent_1px)] [background-size:28px_28px]" />
        {productImages.length ? (
          <div className="relative z-[1]">
            <img src={productImages[0]} alt={product.title} loading="lazy" referrerPolicy="no-referrer" className="h-56 w-full rounded-2xl bg-white object-contain p-2 shadow-2xl" />
            {productImages.length > 1 ? (
              <div className={`mt-3 grid gap-2 ${productImages.length === 4 ? "grid-cols-4" : productImages.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {productImages.slice(1).map((image, index) => (
                  <img key={`${product.id}-${index}-${image}`} src={image} alt={`${product.title} view ${index + 2}`} loading="lazy" referrerPolicy="no-referrer" className="h-20 w-full rounded-xl border border-sky-700/70 bg-white object-contain p-1" />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative z-[1] mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-sky-400/50 bg-sky-950/80 text-3xl font-black tracking-[-.06em] text-yellow-300 shadow-[0_0_36px_rgba(0,177,255,.18)]">{merchantMeta[product.merchant].mark}</div>
        )}
        <span className="absolute left-5 top-5 z-[2] rounded-full border border-yellow-300/30 bg-[#07111d]/90 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-yellow-200">{product.badge}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-sky-300">{product.category}</p>
        <h3 className="mt-3 text-2xl font-black leading-tight text-white">{product.title}</h3>
        {product.note ? <p className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-yellow-200/80">{product.note}</p> : null}
        {product.id === 1 ? <p className="mt-3 rounded-lg border border-yellow-300/25 bg-yellow-300/[.06] px-3 py-2 text-sm font-bold text-yellow-100">Available in gold and black · slim wallet-size card design</p> : null}
        {product.id === 3 ? <p className="mt-3 rounded-lg border border-sky-300/25 bg-sky-300/[.06] px-3 py-2 text-sm font-bold text-sky-100">Shown in black and white · compact USB / OTG memory-card reader</p> : null}
        {product.id === 8 ? <p className="mt-3 rounded-lg border border-sky-300/25 bg-sky-300/[.06] px-3 py-2 text-sm font-bold text-sky-100">Three shared Philips palm-lock views</p> : null}
        {product.id === 9 ? <p className="mt-3 rounded-lg border border-yellow-300/25 bg-yellow-300/[.06] px-3 py-2 text-sm font-bold text-yellow-100">Includes the shared palm-lock views plus the wireless-chime bundle image</p> : null}
        <p className="mt-4 leading-7 text-slate-300">{product.description}</p>
        <ul className="mt-5 grid gap-2 text-sm text-slate-200">{product.features.map((feature) => <li key={feature} className="flex gap-2"><span className="mt-1 text-sky-300">✓</span><span>{feature}</span></li>)}</ul>
        {product.resources?.length ? (
          <div className="mt-6 border-t border-sky-900/70 pt-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-sky-300">Videos & guides</p>
            <div className="grid gap-2">{product.resources.map((resource, index) => <a key={`${product.id}-${index}-${resource.label}`} href={resource.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-sky-800/80 bg-sky-950/40 px-4 py-3 text-sm font-bold text-sky-100 transition hover:border-sky-400 hover:text-yellow-200">▶ {resource.label} →</a>)}</div>
          </div>
        ) : null}
        <div className="mt-auto space-y-3 pt-6">{product.id === 1 ? <Link href="/affiliate-services/dhgate/portable-voice-recorder" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-sky-500 px-5 py-3 text-center font-black text-sky-100 transition hover:border-sky-300 hover:bg-sky-950/70">See Full Product Details →</Link> : null}<a href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-yellow-200">View Product →</a><p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p></div>
      </div>
    </article>
  );
}

export default function AffiliateServicesPage() {
  return <main className="min-h-screen overflow-hidden bg-[#020913] text-white">
    <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,174,255,.18),transparent_26%),radial-gradient(circle_at_85%_60%,rgba(0,126,196,.13),transparent_28%)]" />
    <header className="relative z-10 border-b border-sky-900/70 bg-[#020913]/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8"><Link href="/" className="flex min-w-0 items-center gap-3"><Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 sm:w-40" priority /></Link><nav className="flex items-center gap-3 text-sm font-bold text-sky-100 sm:gap-6"><a href="#products" className="hidden hover:text-yellow-300 sm:inline">Products</a><a href="#disclosure" className="hidden hover:text-yellow-300 sm:inline">Disclosure</a><Link href="/" className="rounded-lg border border-sky-600/70 px-3 py-2">WASCIK Home</Link></nav></div></header>
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24"><p className="mb-4 text-xs font-black uppercase tracking-[.28em] text-sky-300">WASCIK Affiliate Services</p><h1 className="max-w-4xl text-5xl font-black uppercase leading-[.92] tracking-[-.05em] sm:text-6xl lg:text-7xl">Products worth<br/><span className="text-sky-400">a closer look.</span></h1><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">WASCIK Affiliate Services organizes technology, smart-home, wellness, gaming, welding, tickets, and lifestyle products into clear guides. We focus on useful features, intended uses, available setup material, and merchant information—without pretending that research is personal product testing.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#products" className="rounded-lg bg-yellow-300 px-6 py-3 font-black text-slate-950">Browse Products</a><a href="#how-we-select" className="rounded-lg border border-sky-700 px-6 py-3 font-bold">How We Select Products</a><Link href="/start-project" className="rounded-lg border border-sky-700 px-6 py-3 font-bold">Need a Business Website?</Link></div></section>
    <section id="how-we-select" className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/85 px-5 py-14 md:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">How WASCIK builds a product guide</p><h2 className="mt-3 max-w-3xl text-3xl font-black sm:text-5xl">Clear information before a shopping link.</h2><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><article className="rounded-2xl border border-sky-800/70 bg-[#061927] p-5"><strong className="text-yellow-300">01 · Verify the listing</strong><p className="mt-3 leading-7 text-slate-300">We check the merchant page, product identity, available specifications, and whether the offer is still accessible.</p></article><article className="rounded-2xl border border-sky-800/70 bg-[#061927] p-5"><strong className="text-yellow-300">02 · Explain the fit</strong><p className="mt-3 leading-7 text-slate-300">We describe who may find the product useful, common use cases, and important buying considerations.</p></article><article className="rounded-2xl border border-sky-800/70 bg-[#061927] p-5"><strong className="text-yellow-300">03 · Label the evidence</strong><p className="mt-3 leading-7 text-slate-300">Research, merchant claims, and Michael&apos;s firsthand observations are kept distinct so readers know what supports the guide.</p></article><article className="rounded-2xl border border-sky-800/70 bg-[#061927] p-5"><strong className="text-yellow-300">04 · Disclose the link</strong><p className="mt-3 leading-7 text-slate-300">Affiliate links are identified, and current price, availability, and final product details remain the merchant&apos;s responsibility.</p></article></div><p className="mt-7 max-w-4xl leading-8 text-slate-300">WASCIK Affiliate Services is managed by Michael Lewis as part of WASCIK App Development. Product inclusion does not automatically mean Michael owns or personally uses the item.</p></div></section>
    <section className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/85 px-5 py-8 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3"><Link href="/affiliate-services/ticketnetwork" className="rounded-full border border-fuchsia-400/70 bg-fuchsia-500/15 px-4 py-2 text-sm font-black text-fuchsia-100 transition hover:border-fuchsia-300 hover:bg-fuchsia-500/25">TicketNetwork →</Link><a href="#arccaptain" className="rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-sm font-black text-red-100 transition hover:border-red-300 hover:bg-red-500/20">ArcCaptain →</a><Link href="/affiliate-services/eurooptic" className="rounded-full border border-emerald-400/70 bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/25">EuroOptic →</Link><Link href="/affiliate-services/focus-camera" className="rounded-full border border-blue-400/70 bg-blue-500/15 px-4 py-2 text-sm font-black text-blue-100 transition hover:border-blue-300 hover:bg-blue-500/25">Focus Camera →</Link><Link href="/affiliate-services/aquacurve" className="rounded-full border border-cyan-400/70 bg-cyan-500/15 px-4 py-2 text-sm font-black text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/25">AquaCurve →</Link><Link href="/affiliate-services/gearup" className="rounded-full border border-violet-400/70 bg-violet-500/15 px-4 py-2 text-sm font-black text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25">GearUP Gaming →</Link>{merchantOrder.map((merchant) => <a key={merchant} href={`#${merchant.toLowerCase()}`} className="rounded-full border border-sky-800 bg-sky-950/60 px-4 py-2 text-sm font-bold text-sky-100">{merchant}</a>)}</div></section>
    <section id="arccaptain" className="relative z-10 px-5 py-14 md:px-8"><div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-red-500/40 bg-[radial-gradient(circle_at_85%_20%,rgba(220,38,38,.24),transparent_30%),linear-gradient(135deg,#13090b,#07111d)] lg:grid-cols-2"><div className="p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.26em] text-red-300">Welding equipment partner</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">ArcCaptain Welding Equipment</h2><p className="mt-4 max-w-2xl leading-8 text-slate-300">Shop ArcCaptain welding gear including MIG, TIG, stick and plasma equipment, plus helmets and welding accessories.</p><ul className="mt-6 grid gap-2 text-sm text-slate-200"><li>✓ MIG, TIG, stick & plasma equipment</li><li>✓ Welding helmets & accessories</li><li>✓ Direct affiliate shopping link</li></ul><a href="https://arccaptain.pxf.io/c/7587435/3898395/52929" target="_blank" rel="sponsored noopener noreferrer" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-xl bg-red-500 px-7 py-4 text-center font-black text-white transition hover:bg-red-400">Shop ArcCaptain →</a><p className="mt-3 text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p></div><div className="flex items-center justify-center bg-black/20 p-5"><img src="/affiliate/arccaptain/arccaptain-welding.svg" alt="ArcCaptain welding equipment" className="h-auto w-full rounded-2xl border border-red-500/25 object-contain shadow-2xl" /></div></div></section>
    <section className="relative z-10 px-5 py-14 md:px-8"><div className="mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[2rem] border border-violet-400/40 bg-[radial-gradient(circle_at_85%_20%,rgba(139,92,246,.28),transparent_30%),linear-gradient(135deg,#10152e,#07111d)] p-7 sm:p-10 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase tracking-[.26em] text-violet-300">New software & gaming partner</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Meet GearUP for Mobile.</h2><p className="mt-4 max-w-3xl leading-8 text-slate-300">Explore a dedicated gaming hub for GearUP connection-optimization tools, beginning with its Android and iOS mobile game booster.</p></div><Link href="/affiliate-services/gearup" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-violet-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-violet-200">Explore GearUP →</Link></div></section>
    <div id="products" className="relative z-10">{merchantOrder.map((merchant, i) => { const products = affiliateProducts.filter(p => p.merchant === merchant); const meta = merchantMeta[merchant]; return <section key={merchant} id={merchant.toLowerCase()} className={`px-5 py-20 md:px-8 lg:py-24 ${i % 2 === 1 ? "border-y border-sky-900/60 bg-[#04121e]/55" : ""}`}><div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">{meta.kicker}</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">{merchant}</h2><p className="mt-4 max-w-3xl leading-7 text-slate-300">{meta.copy}</p><div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map(product => <ProductCard key={product.id} product={product} />)}<PublishedAffiliateProducts pagePath="/affiliate-services" merchant={merchant} embedded /></div></div></section>; })}</div>
    <section id="disclosure" className="relative z-10 px-5 py-20 md:px-8"><div className="mx-auto max-w-7xl rounded-3xl border border-yellow-300/30 bg-yellow-300/[.06] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.26em] text-yellow-300">Transparency matters</p><h2 className="mt-3 text-3xl font-black">Affiliate Disclosure</h2><p className="mt-5 max-w-4xl leading-8 text-slate-300">Links marked as product links on WASCIK Affiliate Services may be affiliate links. If you click one and make a qualifying purchase, WASCIK may earn a commission from the merchant at no additional cost to you. Product prices, availability, specifications, and promotions can change after publication, so always review the merchant&apos;s current listing before purchasing.</p></div></section>
    <footer className="relative z-10 border-t border-sky-950 bg-[#01070d] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</footer>
  </main>;
}
