import Image from "next/image";
import Link from "next/link";

const services = [
  {
    icon: "🎨",
    title: "Interior & Exterior Painting",
    description:
      "Clean, careful painting that gives rooms, trim, siding, and outdoor spaces a fresh finish.",
  },
  {
    icon: "▦",
    title: "Flooring Installation",
    description:
      "Dependable installation for laminate, luxury vinyl plank, and other practical flooring upgrades.",
  },
  {
    icon: "🛠",
    title: "Drywall Repair",
    description:
      "Professional-looking repairs for holes, cracks, dents, water damage, and worn wall surfaces.",
  },
  {
    icon: "⌂",
    title: "Property Maintenance",
    description:
      "Routine repairs and punch-list help for homeowners, landlords, rentals, and managed properties.",
  },
];

const reviews = [
  {
    quote:
      "Summit made the whole process simple. The work was careful, the communication was clear, and our rooms look completely refreshed.",
    name: "Sarah M.",
    project: "Interior painting",
  },
  {
    quote:
      "They showed up when promised, explained the repair, and left everything clean. Exactly the kind of service a homeowner wants.",
    name: "James R.",
    project: "Drywall repair",
  },
  {
    quote:
      "The new flooring looks great, and the estimate was easy to understand. I would gladly call Summit for another project.",
    name: "Angela T.",
    project: "Flooring installation",
  },
];

type PageMode = "portfolio" | "sample";

export function SummitSite({ mode = "sample" }: { mode?: PageMode }) {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {mode === "portfolio" && (
        <>
      <div className="border-b border-yellow-300 bg-yellow-50 px-4 py-3 text-center text-sm font-semibold leading-6 text-blue-950">
        WASCIK APP DEVELOPMENT — Professional websites for local businesses.
      </div>

      <section
        id="website-demo"
        className="scroll-mt-24 bg-slate-950 px-5 py-14 text-white sm:py-16"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="grid gap-7 sm:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] sm:items-center">
              <div className="mx-auto w-full max-w-sm sm:max-w-none">
                <div className="overflow-hidden rounded-2xl border-2 border-sky-100/80 bg-slate-900 shadow-2xl shadow-black/40">
                  <Image
                    src="/michael-wascik.jpg"
                    alt="Michael of WASCIK App Development"
                    width={1152}
                    height={1536}
                    priority
                    className="aspect-[4/5] h-full w-full object-cover object-[center_22%]"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-slate-300">
                  Michael — Website Developer
                </p>
              </div>

              <div>
                <p className="font-bold uppercase tracking-[0.22em] text-sky-200">
                  Local website design
                </p>
                <p className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  WASCIK
                  <span className="mt-2 block text-2xl font-bold leading-tight text-sky-200 sm:text-3xl lg:text-4xl">
                    App Development
                  </span>
                </p>
                <h1 className="mt-6 text-2xl font-bold leading-tight sm:text-3xl">
                  Your local business deserves a professional website.
                </h1>
                <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                  We create polished, mobile-friendly websites customized with
                  your business name, services, photos, reviews, and contact
                  information. Open our separate Summit Home Services sample
                  project to see what we could build for you.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/sample-project"
                className="flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-center font-bold text-blue-950 transition hover:bg-sky-100"
              >
                View Sample Project →
              </a>
              <a
                href="tel:+15015782259"
                className="flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-center font-bold text-white transition hover:bg-white hover:text-slate-950"
              >
                Call Michael: (501) 578-2259
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-7 shadow-xl ring-1 ring-white/15">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-200">
              90-day promotional pricing
            </p>
            <div className="mt-3 rounded-xl border border-sky-100/60 bg-sky-100/10 p-5">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-4xl font-bold text-white">$324</span>
                <span className="pb-1 text-slate-200">
                  one-page website
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Promotional price available during the first 90 days. After the
                promotion, the regular one-page website price is <strong>$399</strong>.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-200">
                  Extra pages
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  $100 each during promotion
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  $125 per additional page after the 90-day promotional period.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-200">
                  Domain
                </p>
                <p className="mt-2 text-lg font-bold text-white">$25 upfront</p>
                <p className="mt-1 text-sm text-slate-300">
                  Domain renewal is billed separately when due.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-200">
                  Hosting &amp; security
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  $20 monthly or $240 yearly
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Choose monthly billing or pay the full year.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-200">
                  Maintenance &amp; updates
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  $39.99/month first year
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Then $49.99 per month after the first year.
                </p>
              </div>
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              A website built around your business
            </h2>
            <ul className="mt-5 space-y-3 text-slate-200">
              <li>✓ One-page, mobile-friendly website</li>
              <li>✓ Customized name, colors, photos, and business details</li>
              <li>✓ Up to six services plus customer reviews</li>
              <li>✓ Contact or estimate-request form</li>
              <li>✓ Call and email buttons plus basic search setup</li>
              <li>✓ Two rounds of revisions</li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Website-build and additional-page prices are one-time charges.
              Domain, hosting and security, and maintenance are separate services.
            </p>
            <div className="mt-6 rounded-lg bg-black/20 p-4 text-sm leading-7 text-slate-200">
              <p>
                <span className="font-bold text-white">Contact:</span> Michael
              </p>
              <p>
                <span className="font-bold text-white">Phone:</span>{" "}
                <a className="underline underline-offset-2 hover:text-sky-200" href="tel:+15015782259">
                  (501) 578-2259
                </a>
              </p>
              <p>
                <span className="font-bold text-white">Email:</span>{" "}
                <a
                  className="break-all underline underline-offset-2 hover:text-sky-200"
                  href="mailto:LewisMike0435@gmail.com"
                >
                  LewisMike0435@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
        </>
      )}

      {mode === "sample" && (
        <>
      <div className="border-b border-sky-200 bg-white px-4 py-3 text-center text-sm font-semibold leading-6 text-blue-950">
        DEMO WEBSITE — Summit Home Services is a fictional sample created by
        WASCIK App Development.{" "}
        <Link href="/" className="underline decoration-2 underline-offset-2">
          ← Back to the WASCIK Portfolio
        </Link>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#home" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-950 text-xl font-bold text-yellow-300">
              S
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">
                Summit Home Services
              </span>
              <span className="block text-xs text-slate-600">
                Reliable Work. Honest Service.
              </span>
            </span>
          </a>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
            <a href="#home" className="font-medium hover:text-yellow-600">Home</a>
            <a href="#services" className="font-medium hover:text-yellow-600">Services</a>
            <a href="#about" className="font-medium hover:text-yellow-600">About</a>
            <a href="#reviews" className="font-medium hover:text-yellow-600">Reviews</a>
            <a href="#contact" className="font-medium hover:text-yellow-600">Contact</a>
          </nav>

          <a
            href="#contact"
            className="hidden min-h-11 items-center justify-center rounded-lg bg-yellow-300 px-5 py-3 font-bold text-blue-950 transition hover:bg-yellow-400 sm:flex"
          >
            Free Estimate
          </a>
        </div>
      </header>

      <section
        id="home"
        className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="mb-4 font-semibold uppercase tracking-widest text-yellow-300">
              Serving Central Arkansas
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Reliable help for a home that looks and feels its best.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Summit Home Services provides dependable painting, flooring,
              drywall repair, property maintenance and other practical
              improvements for homeowners, landlords and property managers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="flex min-h-12 items-center justify-center rounded-lg bg-yellow-300 px-6 py-3 text-center font-bold text-blue-950 transition hover:bg-yellow-400"
              >
                Request a Free Estimate
              </a>
              <a
                href="#services"
                className="flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-center font-bold text-white transition hover:bg-white hover:text-slate-950"
              >
                View Our Services
              </a>
            </div>
            <div className="mt-9 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <p>✓ Reliable service</p>
              <p>✓ Quality-focused work</p>
              <p>✓ Clear estimates</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl">
            <div className="flex min-h-72 flex-col justify-end rounded-xl bg-gradient-to-br from-white via-yellow-100 to-yellow-300 p-7 text-blue-950 sm:min-h-96">
              <p className="text-sm font-bold uppercase tracking-widest">
                Home improvement made simple
              </p>
              <p className="mt-2 text-3xl font-bold">
                Careful work. Respectful service. Better results.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-semibold uppercase tracking-widest text-yellow-600">
              Our services
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Practical help for homes and properties
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              From one-room updates to ongoing property care, Summit focuses on
              dependable work, honest communication, and a clean finished result.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-2xl font-bold text-yellow-700"
                >
                  {service.icon}
                </span>
                <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {service.description}
                </p>
                <a
                  href="#contact"
                  className="mt-5 inline-block font-bold text-yellow-700 hover:text-yellow-900"
                >
                  Ask about this service →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-yellow-50 px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl bg-blue-950 p-8 text-white shadow-xl sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
              The Summit standard
            </p>
            <p className="mt-5 text-3xl font-bold leading-tight">
              Treat every property with care. Do what was promised. Leave the
              space better than we found it.
            </p>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-widest text-yellow-700">
              About us
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Straightforward service you can feel good about
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Summit Home Services is a fictional Central Arkansas company
              created to demonstrate how a polished local-business website can
              build trust and turn visitors into new customer inquiries.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              The brand is built around the qualities real customers look for:
              clear estimates, respectful communication, careful work, and
              reliable follow-through.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-yellow-700">Clear</p>
                <p className="mt-1 text-sm text-slate-600">Project communication</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-yellow-700">Local</p>
                <p className="mt-1 text-sm text-slate-600">Central Arkansas focus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="scroll-mt-24 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-semibold uppercase tracking-widest text-yellow-700">
              Customer feedback
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Sample customer reviews
            </h2>
            <p className="mt-4 text-slate-600">
              Example testimonials for this portfolio demonstration.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <figure
                key={review.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div aria-label="5 out of 5 stars" className="text-xl tracking-wider text-yellow-500">
                  ★★★★★
                </div>
                <blockquote className="mt-4 leading-7 text-slate-700">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-slate-200 pt-4">
                  <p className="font-bold">{review.name}</p>
                  <p className="text-sm text-slate-500">{review.project}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-blue-950 px-5 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-semibold uppercase tracking-widest text-yellow-300">
              Let&apos;s talk
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Request a free estimate
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-300">
              Tell us what your property needs. We&apos;ll follow up to learn
              more, answer questions, and arrange an estimate.
            </p>
            <div className="mt-8 space-y-3 text-slate-200">
              <p>✓ No-pressure project conversation</p>
              <p>✓ Clear next steps</p>
              <p>✓ Serving Central Arkansas</p>
            </div>
          </div>

          <form className="grid gap-5 rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:grid-cols-2 sm:p-8">
            <label className="font-semibold">
              Name
              <input
                type="text"
                name="name"
                placeholder="Your name"
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-4 font-normal outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </label>
            <label className="font-semibold">
              Phone
              <input
                type="tel"
                name="phone"
                placeholder="(501) 555-0123"
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-4 font-normal outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </label>
            <label className="font-semibold sm:col-span-2">
              Email
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-4 font-normal outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </label>
            <label className="font-semibold sm:col-span-2">
              Service needed
              <select
                name="service"
                defaultValue=""
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-normal outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              >
                <option value="" disabled>Select a service</option>
                <option>Interior or exterior painting</option>
                <option>Flooring installation</option>
                <option>Drywall repair</option>
                <option>Property maintenance</option>
                <option>Other home improvement</option>
              </select>
            </label>
            <label className="font-semibold sm:col-span-2">
              Project details
              <textarea
                name="details"
                rows={5}
                placeholder="Tell us a little about the project..."
                className="mt-2 w-full rounded-lg border border-slate-300 p-4 font-normal outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-yellow-300 px-6 py-3 font-bold text-blue-950 ring-1 ring-yellow-200 transition hover:bg-yellow-400 sm:col-span-2"
            >
              Send Estimate Request
            </button>
            <p className="text-center text-xs text-slate-500 sm:col-span-2">
              Demonstration form only — no information is submitted.
            </p>
          </form>
        </div>
      </section>

      <footer className="bg-blue-950 px-5 py-10 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-7 border-b border-white/10 pb-7 sm:grid-cols-2">
          <div>
            <p className="text-lg font-bold text-white">Summit Home Services</p>
            <p className="mt-1 text-sm">Reliable Work. Honest Service.</p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-bold text-yellow-300">WASCIK App Development</p>
            <p className="mt-1">Professional websites for local businesses</p>
            <p className="mt-2">
              Michael ·{" "}
              <a className="hover:text-yellow-300" href="tel:+15015782259">
                (501) 578-2259
              </a>
            </p>
            <a
              className="break-all hover:text-yellow-300"
              href="mailto:LewisMike0435@gmail.com"
            >
              LewisMike0435@gmail.com
            </a>
          </div>
        </div>
        <p className="mx-auto max-w-7xl pt-6 text-center text-xs leading-6 text-slate-400">
          Summit Home Services is a fictional company created solely for
          demonstration and portfolio purposes. The services, customer reviews,
          contact form, and business claims shown on this website are examples
          and do not represent a real operating home-services company. Website
          designed and developed by WASCIK App Development.
        </p>
      </footer>
        </>
      )}
    </main>
  );
}

export default function PortfolioPage() {
  return <SummitSite mode="portfolio" />;
}
