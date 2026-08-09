import Image from "next/image";
import Link from "next/link";

const benefits = [
  { number: "01", title: "Connection optimization", copy: "GearUP says its patented network technology is designed to find a better route between your device and the game server." },
  { number: "02", title: "One-tap boosting", copy: "Choose a supported game and start the connection boost without working through complicated network settings." },
  { number: "03", title: "Worldwide game support", copy: "Built for players connecting to thousands of games and servers across regions around the world." },
  { number: "04", title: "Made for mobile", copy: "GearUP states that its mobile booster is designed for Android and iOS without adding extra data or battery use." },
];

const steps = ["Choose your game", "Select the game server", "Start the one-tap boost", "Launch the game and monitor the connection"];

export default function GearUpPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05040d] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,.25),transparent_29%),radial-gradient(circle_at_88%_48%,rgba(0,211,255,.14),transparent_27%)]" />

      <header className="relative z-10 border-b border-violet-900/60 bg-[#05040d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex items-center gap-3">
            <Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority />
            <span className="hidden text-sm font-black uppercase tracking-[.15em] text-violet-100 sm:block">Affiliate Services</span>
          </Link>
          <Link href="/affiliate-services" className="rounded-lg border border-violet-500/70 px-4 py-2 text-sm font-bold text-violet-100 transition hover:border-violet-300">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.04fr_.96fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-violet-300">WASCIK Software & Gaming</p>
            <h1 className="mt-5 text-6xl font-black uppercase leading-[.84] tracking-[-.07em] sm:text-7xl lg:text-8xl">Gear<span className="text-violet-400">UP</span></h1>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Less time fighting lag.<br />More time in the game.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">GearUP for Mobile is a connection-optimization service designed to help Android and iOS players reduce game lag and high ping through a simpler, one-tap experience.</p>
            <div className="mt-7 flex flex-wrap gap-2">{["Android + iOS", "One-tap boost", "Worldwide servers", "Thousands of games"].map((item) => <span key={item} className="rounded-full border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-100">✓ {item}</span>)}</div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#mobile" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-violet-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-violet-200">Explore GearUP Mobile ↓</a><a href="#how-it-works" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-violet-700 px-7 py-4 font-bold text-violet-100">How It Works</a></div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-10 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative rotate-2 rounded-[2.5rem] border border-violet-400/40 bg-gradient-to-br from-[#2b1b59] via-[#12132c] to-[#07101e] p-5 shadow-[0_35px_100px_rgba(0,0,0,.55)]">
              <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                <div className="flex items-center justify-between"><span className="text-sm font-black tracking-[.22em] text-violet-200">GEARUP</span><span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]" /></div>
                <div className="my-12 text-center"><div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-8 border-violet-400/25 bg-violet-400/10 shadow-[0_0_55px_rgba(167,139,250,.28)]"><div><p className="text-5xl font-black text-violet-200">GO</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">One-tap boost</p></div></div></div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-white/[.06] p-3"><p className="font-black text-cyan-300">PING</p><p className="mt-1 text-slate-400">Monitor</p></div><div className="rounded-xl bg-white/[.06] p-3"><p className="font-black text-violet-300">ROUTE</p><p className="mt-1 text-slate-400">Optimize</p></div><div className="rounded-xl bg-white/[.06] p-3"><p className="font-black text-emerald-300">PLAY</p><p className="mt-1 text-slate-400">Connect</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mobile" className="relative z-10 border-y border-violet-950 bg-[#0b0918]/85 px-5 py-16 md:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[.28em] text-violet-300">Current featured offer</p><div className="mt-5 grid gap-8 rounded-[2rem] border border-violet-500/35 bg-gradient-to-br from-violet-500/[.13] to-cyan-500/[.05] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><h2 className="text-4xl font-black sm:text-5xl">GearUP for Mobile</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">A subscription-based mobile game booster designed for players whose route to a game server produces unstable latency, lag spikes, or high ping. Results can vary by location, network, device, game, and server.</p><p className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] px-4 py-3 text-sm leading-6 text-cyan-100">We have not personally tested GearUP yet. Product descriptions on this page are based on information supplied by GearUP.</p></div><div className="min-w-64"><a href="https://gearupapp.pxf.io/c/7587435/3911079/53368" target="_blank" rel="sponsored noopener noreferrer" className="flex min-h-14 items-center justify-center rounded-xl bg-violet-300 px-7 py-4 text-center font-black text-slate-950 transition hover:bg-violet-200">Get GearUP for Mobile ↗</a><p className="mt-3 text-center text-xs text-slate-500">Opens GearUP through our tracked affiliate link.</p></div></div></div>
      </section>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.28em] text-violet-300">Why players consider it</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Built around the connection.</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map((benefit) => <article key={benefit.number} className="rounded-2xl border border-violet-900/70 bg-[#0c0b1a] p-6"><span className="text-3xl font-black text-violet-400">{benefit.number}</span><h3 className="mt-4 text-xl font-black">{benefit.title}</h3><p className="mt-3 leading-7 text-slate-400">{benefit.copy}</p></article>)}</div></div></section>

      <section id="how-it-works" className="relative z-10 border-y border-violet-950 bg-[#0b0918]/75 px-5 py-16 md:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-[.28em] text-violet-300">A simpler start</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">From download to game in four steps.</h2><p className="mt-5 leading-8 text-slate-400">GearUP is designed to handle the network-route selection behind the scenes, so players can focus on selecting their game and server.</p></div><ol className="grid gap-3">{steps.map((step, index) => <li key={step} className="flex items-center gap-4 rounded-2xl border border-violet-900/60 bg-violet-500/[.06] p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-300 font-black text-slate-950">{index + 1}</span><span className="font-bold text-slate-200">{step}</span></li>)}</ol></div></section>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-2"><article className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[.06] p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[.24em] text-emerald-300">May be worth exploring if</p><h2 className="mt-3 text-3xl font-black">Your game connection is the problem.</h2><ul className="mt-6 grid gap-3 text-slate-300">{["Your ping changes sharply during play", "You connect to game servers in another region", "Your normal internet works, but a specific game feels unstable", "You want a simple mobile-focused tool"].map((item) => <li key={item} className="flex gap-3"><span className="text-emerald-300">✓</span><span>{item}</span></li>)}</ul></article><article className="rounded-3xl border border-amber-300/25 bg-amber-300/[.06] p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[.24em] text-amber-200">Keep expectations realistic</p><h2 className="mt-3 text-3xl font-black">No booster can fix every cause of lag.</h2><p className="mt-5 leading-8 text-slate-300">A game booster cannot repair weak Wi-Fi, an overloaded home network, device performance limits, or problems at the game server itself. Review the current trial, price, renewal terms, supported games, and cancellation policy before subscribing.</p></article></div></section>

      <section className="relative z-10 border-t border-violet-950 bg-[#020207] px-5 py-14 md:px-8"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-violet-300">Coming next</p><h2 className="mt-3 text-3xl font-black">One GearUP hub. More products as we add them.</h2><p className="mt-4 leading-7 text-slate-400">This page is structured to grow with additional approved GearUP offers, including Windows and network-hardware products, without crowding the main WASCIK affiliate catalog.</p><div className="mt-8 rounded-2xl border border-yellow-300/25 bg-yellow-300/[.06] p-6 text-left"><p className="font-black text-yellow-200">Affiliate disclosure</p><p className="mt-2 leading-7 text-slate-400">WASCIK may earn a commission when you purchase through a qualifying GearUP affiliate link, at no additional cost to you. Prices, eligibility, supported games, features, and promotions may change.</p></div><Link href="/affiliate-services" className="mt-8 inline-block font-bold text-violet-300 hover:text-violet-200">Explore all WASCIK affiliate picks →</Link></div></section>
    </main>
  );
}
