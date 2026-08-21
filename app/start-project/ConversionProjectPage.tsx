import Image from "next/image";
import Link from "next/link";
import AIAssistantDemo from "../AIAssistantDemo";

const included = [
  "Custom one-page business website",
  "Mobile-friendly responsive design",
  "Business information and services",
  "Clear contact and call buttons",
  "Two revision rounds",
  "Direct communication with Michael",
];

const services = [
  ["Websites", "Professional business websites built to turn visitors into inquiries."],
  ["Mobile Apps", "Custom mobile experiences for customers, communities, and internal workflows."],
  ["AI Solutions", "Website assistants, lead support, customer guidance, and practical automation."],
  ["E-Commerce", "Online storefronts designed to make products easy to browse and buy."],
  ["Branding", "Logos, visual systems, advertisements, and digital materials for a consistent identity."],
  ["Support", "Ongoing updates, maintenance, hosting guidance, and direct technical help."],
];

const claimHref =
  "mailto:LewisMike0435@gmail.com?subject=Claim%20the%20%24324%20Website%20Special&body=Hi%20Michael%2C%20I%27m%20interested%20in%20the%20%24324%20website%20special.%20My%20business%20is%3A%20";

const questionHref =
  "mailto:LewisMike0435@gmail.com?subject=Question%20about%20a%20WASCIK%20website&body=Hi%20Michael%2C%20I%20have%20a%20question%20about%20getting%20a%20website%20for%20my%20business.%20";

export default function ConversionProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-cyan-300/15 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="WASCIK home">
            <Image
              src="/wascik-logo-v2.png?v=20260809"
              alt="WASCIK App Development"
              width={1812}
              height={868}
              priority
              className="h-10 w-auto sm:h-12"
            />
            <span className="hidden text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 sm:block">
              App Development
            </span>
          </Link>
          <a
            href="tel:+15015782259"
            className="rounded-full border border-cyan-300/50 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
          >
            Call Michael
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-cyan-300/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-amber-200">
              Introductory small-business website offer
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Get your business online with a professional website for <span className="text-cyan-300">$324.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              A clean, mobile-friendly one-page business website built around your services, your customers, and a clear way for people to contact you.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={claimHref}
                className="flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-6 py-3 text-center font-black text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200"
              >
                Claim the $324 Website
              </a>
              <a
                href={questionHref}
                className="flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10"
              >
                Ask Michael a Question
              </a>
              <Link
                href="/sample-project"
                className="flex min-h-12 items-center justify-center rounded-xl border border-cyan-300/30 px-6 py-3 text-center font-bold text-cyan-100 transition hover:bg-cyan-300/10"
              >
                See a Website Example
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <p>✓ Mobile-first design</p>
              <p>✓ Two revision rounds</p>
              <p>✓ Direct developer support</p>
            </div>
          </div>

          <aside className="rounded-3xl border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">What you get</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-black text-white">$324</span>
              <span className="pb-2 text-slate-400">one-time website build</span>
            </div>
            <ul className="mt-6 space-y-3 text-slate-200">
              {included.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="font-black text-cyan-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">
              No mystery package and no giant agency handoff. You work directly with the developer building your site.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">See the work before you decide</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">You should be able to see what WASCIK can build.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-slate-600">
                Our portfolio includes a complete local-business website demonstration so you can inspect the layout, mobile experience, service presentation, calls to action, and overall polish before you contact us.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sample-project"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-slate-800"
                >
                  Open the Website Demo
                </Link>
                <a
                  href="tel:+15015782259"
                  className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Talk Directly With Michael
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Portfolio demonstration</p>
                  <p className="mt-1 text-2xl font-black">Summit Home Services</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Live demo</span>
              </div>
              <p className="mt-5 leading-7 text-slate-600">
                This sample is intentionally labeled as a fictional business. It demonstrates the quality and conversion structure WASCIK can apply to a real small-business website without pretending we already have customer testimonials we have not earned yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Why is it only $324?</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">It is an introductory offer while we grow the WASCIK client portfolio.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-slate-300">
            <p>
              The lower price is deliberate. WASCIK is building its early client base, and the introductory website special gives small businesses a lower-cost way to work with us while we build more real-world portfolio projects and long-term relationships.
            </p>
            <p>
              The price does not mean a template dump or an anonymous handoff. The goal is a professional, focused business website with direct communication and a clear scope.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">Start simple. Grow later.</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Your website can be the first piece of a bigger digital system.</h2>
            <p className="mt-5 leading-7 text-slate-600">
              The $324 website is the clearest place to start. If your business needs more later, WASCIK can also build the additional technology around it.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([title, copy]) => (
              <article key={title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-cyan-300/10 bg-slate-950 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Want to see where we are going next?</p>
            <h2 className="mt-3 text-3xl font-black">AI is an additional capability—not a hurdle between you and getting a website.</h2>
            <p className="mt-4 leading-7 text-slate-400">
              Explore the WASCIK AI assistant demonstration after you have seen the website offer. It is one example of the advanced tools we are building for businesses that want more automation later.
            </p>
          </div>
          <AIAssistantDemo />
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-950 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">No-pressure next step</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Interested, but not ready to “claim” anything yet?</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Ask a question first. Tell Michael what kind of business you run, whether you already have a website, and what you want customers to be able to do online.
            </p>
          </div>
          <div className="grid gap-3">
            <a href={questionHref} className="rounded-xl bg-cyan-300 px-6 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-200">
              Ask Michael a Question
            </a>
            <a href={claimHref} className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-6 py-4 text-center font-black text-amber-100 transition hover:bg-amber-300/20">
              Claim the $324 Website Special
            </a>
            <a href="tel:+15015782259" className="rounded-xl border border-white/20 px-6 py-4 text-center font-bold text-white transition hover:bg-white/10">
              Call (501) 578-2259
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-5 py-8 text-center text-sm text-slate-500">
        © 2026 WASCIK™ App Development · Serving Central Arkansas and businesses everywhere.
      </footer>
    </main>
  );
}
