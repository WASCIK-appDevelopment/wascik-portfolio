import Image from "next/image";
import Link from "next/link";

const affiliateUrl = "https://dhgate.sjv.io/k4NeKd";

const features = [
  { title: "Slim card-size design", copy: "Built to slip into a wallet, pocket, notebook, or work bag without the bulk of a traditional recorder." },
  { title: "Voice-activated recording", copy: "Designed to begin capturing sound when voices are detected, helping reduce long stretches of silence." },
  { title: "Long recording time", copy: "The product listing advertises approximately 40 hours of recording time for meetings, lectures, and extended notes." },
  { title: "Expandable storage", copy: "Supports compatible memory cards up to 128 GB, giving you room for a larger collection of audio files." },
];

const useCases = ["Lectures and study notes", "Meetings and interviews", "Personal reminders", "Creative ideas on the go"];

export default function PortableVoiceRecorderAdPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020913] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_15%_10%,rgba(0,174,255,.20),transparent_27%),radial-gradient(circle_at_85%_48%,rgba(255,214,45,.10),transparent_25%)]" />

      <header className="relative z-10 border-b border-sky-900/70 bg-[#020913]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex items-center gap-3">
            <Image src="/wascik-logo-v2.png" alt="WASCIK" width={1254} height={1254} className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.16em] text-sky-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services#dhgate" className="rounded-lg border border-sky-600/70 px-4 py-2 text-sm font-bold text-sky-100 transition hover:border-sky-300 hover:text-yellow-200">← All DHgate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-14 md:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.28em] text-sky-300">DHgate tech pick · audio & productivity</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[.92] tracking-[-.055em] sm:text-6xl lg:text-7xl">Big ideas.<br /><span className="text-sky-400">Pocket-size recorder.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Capture lectures, conversations, meetings, and sudden ideas with a slim rechargeable voice recorder made for everyday carry.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Gold or black", "Voice activated", "USB 2.0", "Up to 128 GB card support"].map((item) => <span key={item} className="rounded-full border border-sky-700/80 bg-sky-950/65 px-4 py-2 text-sm font-bold text-sky-100">✓ {item}</span>)}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-yellow-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-yellow-200">Check Price & Availability →</a>
              <a href="#details" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-sky-700 px-7 py-4 font-bold text-sky-100 transition hover:border-sky-300">See Why It Stands Out</a>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing, specifications, and availability may change.</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="relative rounded-[2rem] border border-sky-700/70 bg-gradient-to-br from-[#0a2b40] to-[#03101b] p-4 shadow-[0_28px_80px_rgba(0,0,0,.45)] sm:p-6">
              <div className="rounded-3xl bg-white p-4"><Image src="/affiliate/dhgate/voice-recorder-gold.webp" alt="Gold portable digital voice recorder" width={1024} height={1024} className="h-auto w-full object-contain" priority /></div>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
                <div><p className="text-xs font-black uppercase tracking-[.18em] text-yellow-300">Two color choices</p><p className="mt-1 font-bold text-slate-200">Clean gold or classic black</p></div>
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-sky-700 bg-white p-1 sm:h-28 sm:w-28"><Image src="/affiliate/dhgate/voice-recorder-black.webp" alt="Black portable digital voice recorder" width={1024} height={1024} className="h-full w-full object-contain" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="details" className="relative z-10 border-y border-sky-900/70 bg-[#04121e]/80 px-5 py-16 md:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.26em] text-sky-300">Small device, practical purpose</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Ready when you need to remember it.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Instead of reaching for your phone, opening an app, and risking distractions, this recorder gives you a dedicated way to preserve important audio and return to it later.</p></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature, index) => <article key={feature.title} className="rounded-2xl border border-sky-800/70 bg-[#061827] p-6"><span className="text-3xl font-black text-yellow-300">0{index + 1}</span><h3 className="mt-4 text-xl font-black">{feature.title}</h3><p className="mt-3 leading-7 text-slate-400">{feature.copy}</p></article>)}</div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-sky-800/70 bg-gradient-to-br from-[#09283b] to-[#03101b] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.24em] text-sky-300">Made for real-life moments</p><h2 className="mt-3 text-3xl font-black">One recorder. Plenty of uses.</h2><ul className="mt-7 grid gap-4 sm:grid-cols-2">{useCases.map((item) => <li key={item} className="flex items-center gap-3 rounded-xl border border-sky-900 bg-sky-950/45 p-4 font-bold text-slate-200"><span className="text-yellow-300">●</span>{item}</li>)}</ul></div>
          <div className="rounded-3xl border border-yellow-300/30 bg-yellow-300/[.07] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.24em] text-yellow-300">Before you buy</p><h2 className="mt-3 text-3xl font-black">Check the current listing.</h2><p className="mt-5 leading-8 text-slate-300">Confirm the included accessories, compatible memory card, current specifications, shipping estimate, seller details, and return terms on DHgate before completing your order.</p><a href={affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-yellow-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-yellow-200">View the Recorder on DHgate →</a></div>
        </div>
      </section>

      <section className="relative z-10 border-t border-sky-900/70 bg-[#01070d] px-5 py-14 text-center md:px-8"><div className="mx-auto max-w-3xl"><Image src="/wascik-logo-v2.png" alt="WASCIK" width={1254} height={1254} className="mx-auto h-16 w-16 rounded-2xl object-contain" /><h2 className="mt-5 text-3xl font-black">A practical tech pick from WASCIK™.</h2><p className="mt-4 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through product links, at no additional cost to you.</p><Link href="/affiliate-services" className="mt-6 inline-block font-bold text-sky-300 hover:text-yellow-300">Explore all affiliate picks →</Link><p className="mt-8 text-xs text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</p></div></section>
    </main>
  );
}
