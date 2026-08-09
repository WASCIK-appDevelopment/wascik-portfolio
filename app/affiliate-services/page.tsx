import Image from "next/image";
import Link from "next/link";
import { affiliateProducts, merchantOrder } from "./products";
import { suppliedProductImageUrls } from "./revo-image-urls";

const merchantMeta = {
  DHgate: { kicker: "Tech & everyday gadgets", copy: "Compact technology, creator tools, travel gear, and practical accessories selected for useful everyday applications.", mark: "DH" },
  Philips: { kicker: "Smart home & security", copy: "Video doorbells and smart locks focused on practical entry control, front-door awareness, and connected-home convenience.", mark: "PH" },
  RevoMatic: { kicker: "Fitness, recovery & beauty tech", copy: "Massage, recovery, skincare, and home-fitness products designed for convenient at-home routines.", mark: "RE" },
};

function ProductCard({ product }: { product: (typeof affiliateProducts)[number] }) {
  const productImages = product.id === 1
    ? [
        "/affiliate/dhgate/voice-recorder-gold-clean.png",
        "/affiliate/dhgate/voice-recorder-black-clean.png",
        "https://s.alicdn.com/%40sc04/kf/H8f79dd7e50ec417786680eb1d4edbd43H/750mah-Long-Battrey-Life-Sound-Recorder-150-Hours-Working-Slim-Card-Size-Voice-Activated-Recording-Mini-Audio-Recorder-Device.jpg",
      ]
    : product.id === 3
      ? [
          "/affiliate/dhgate/card-reader-white-clean.jpg",
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
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sky-800/70 bg-gradient-to-br from-[#09283b] to-[#03101b] shadow-[0_20px_55px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-sky-400/80">
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
        {product.id === 3 ? <p className="mt-3 rounded-lg border border-sky-300/25 bg-sky-300/[.06] px-3 py-2 text-sm font-bold text-sky-100">Compact white USB / OTG memory-card reader</p> : null}
        {product.id === 8 ? <p className="mt-3 rounded-lg border border-sky-300/25 bg-sky-300/[.06] px-3 py-2 text-sm font-bold text-sky-100">Three shared Philips palm-lock views</p> : null}
        {product.id === 9 ? <p className="mt-3 rounded-lg border border-yellow-300/25 bg-yellow-300/[.06] px-3 py-2 text-sm font-bold text-yellow-100">Includes the shared palm-lock views plus the wireless-chime bundle image</p> : null}
        <p className="mt-4 leading-7 text-slate-300">{product.description}</p>
        <ul className="mt-5 grid gap-2 text-sm text-slate-200">{product.features.map((feature) => <li key={feature} className="flex gap-2"><span className="mt-1 text-sky-300">✓</span><span>{feature}</span></li>)}</ul>
        {product.resources?.length ? (
          <div className="mt-6 border-t border-sky-900/70 pt-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-sky-300">Videos & guides</p>
            <div className="grid gap-2">{product.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-sky-800/80 bg-sky-950/40 px-4 py-3 text-sm font-bold text-sky-100 transition hover:border-sky-400 hover:text-yellow-200">▶ {resource.label} →</a>)}</div>
          </div>
        ) : null}
        <div className="mt-auto pt-6"><a href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-yellow-200">View Product →</a><p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p></div>
      </div>
    </article>
  );
}

export default function AffiliateServicesPage() {
  return <main className="min-h-screen overflow-hidden bg-[#020913] text-white">
    <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,174,255,.18),transparent_26%),radial-gradient(circle_at_85%_60%,rgba(0,126,196,.13),transparent_28%)]" />
    <header className="relative z-10 border-b border-sky-900/70 bg-[#020913]/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8"><Link href="/" className="flex min-w-0 items-center gap-3"><Image src="/wascik-logo-v2.png" alt="WASCIK" width={1812} height={868} className="h-auto w-32 sm:w-40" priority /></Link><nav className="flex items-center gap-3 text-sm font-bold text-sky-100 sm:gap-6"><a href="#products" className="hidden hover:text-yellow-300 sm:inline">Products</a><a href="#disclosure" className="hidden hover:text-yellow-300 sm:inline">Disclosure</a><Link href="/" className="rounded-lg border border-sky-600/70 px-3 py-2">WASCIK Home</Link></nav></div></header>
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24"><p className="mb-4 text-xs font-black uppercase tracking-[.28em] text-sky-300">WASCIK Affiliate Services</p><h1 className="max-w-4xl text-5xl font-black uppercase leading-[.92] tracking-[-.05em] sm:text-6xl lg:text-7xl">Products worth<br/><span className="text-sky-400">a closer look.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Research-backed product picks with product imagery, key features, and useful training or setup resources where reliable material is available.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#products" className="rounded-lg bg-yellow-300 px-6 py-3 font-black text-slate-950">Browse Products</a><a href="#disclosure" className="rounded-lg border border-sky-700 px-6 py-3 font-bold">Affiliate Disclosure</a></div></section>
    <section className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/85 px-5 py-8 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">{merchantOrder.map((merchant) => <a key={merchant} href={`#${merchant.toLowerCase()}`} className="rounded-full border border-sky-800 bg-sky-950/60 px-4 py-2 text-sm font-bold text-sky-100">{merchant}</a>)}</div></section>
    <div id="products" className="relative z-10">{merchantOrder.map((merchant, i) => { const products = affiliateProducts.filter(p => p.merchant === merchant); const meta = merchantMeta[merchant]; return <section key={merchant} id={merchant.toLowerCase()} className={`px-5 py-20 md:px-8 lg:py-24 ${i % 2 === 1 ? "border-y border-sky-900/60 bg-[#04121e]/55" : ""}`}><div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">{meta.kicker}</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">{merchant}</h2><p className="mt-4 max-w-3xl leading-7 text-slate-300">{meta.copy}</p><div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map(product => <ProductCard key={product.id} product={product} />)}</div></div></section>; })}</div>
    <section id="disclosure" className="relative z-10 px-5 py-20 md:px-8"><div className="mx-auto max-w-7xl rounded-3xl border border-yellow-300/30 bg-yellow-300/[.06] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.26em] text-yellow-300">Transparency matters</p><h2 className="mt-3 text-3xl font-black">Affiliate Disclosure</h2><p className="mt-5 max-w-4xl leading-8 text-slate-300">Links marked as product links on WASCIK Affiliate Services may be affiliate links. If you click one and make a qualifying purchase, WASCIK may earn a commission from the merchant at no additional cost to you. Product prices, availability, specifications, and promotions can change after publication, so always review the merchant&apos;s current listing before purchasing.</p></div></section>
    <footer className="relative z-10 border-t border-sky-950 bg-[#01070d] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK Affiliate Services · A WASCIK digital project.</footer>
  </main>;
}
