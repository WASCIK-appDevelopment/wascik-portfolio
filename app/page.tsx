import Image from "next/image";
import Link from "next/link";
import AIAssistantDemo from "./AIAssistantDemo";

const portfolioServices = [
  { icon: "web", title: "Websites", copy: "Fast, responsive business websites with clear calls to action, polished layouts, and pages that work beautifully on phones." },
  { icon: "app", title: "Mobile Apps", copy: "Custom app experiences built around your customers, services, community, and long-term business goals." },
  { icon: "ai", title: "AI Solutions", copy: "Smart website assistants, customer guidance, lead support, and practical automation designed around your brand." },
  { icon: "shop", title: "E-Commerce", copy: "Online storefronts that present products clearly and make browsing, ordering, and checkout feel simple." },
  { icon: "brand", title: "Design & Branding", copy: "Logos, colors, visual systems, advertisements, and digital materials that give your business a memorable identity." },
  { icon: "support", title: "Support", copy: "Real maintenance, updates, hosting guidance, and direct help from someone who understands your website." },
];

function ServiceIcon({ type }: { type: string }) {
  return <span className={`tech-icon tech-icon-${type}`} aria-hidden="true"><i /><b /><em /></span>;
}

function CodeBackdrop() {
  return (
    <div className="code-backdrop" aria-hidden="true">
      <div className="circuit-field" />
      <code className="code-print code-print-left">const vision = &quot;built forward&quot;;<br/>WASCIK.create(&#123; design, technology, support &#125;);<br/>business.connect(customers);<br/>experience.mobile = true;</code>
      <code className="code-print code-print-right">if (idea) WASCIK.build(idea);<br/>const future = await launch();<br/>brand.voice = &quot;personal&quot;;<br/>support.local = true;</code>
      <code className="code-print code-print-middle">function growBusiness() &#123;<br/> return clarity + creativity + code;<br/>&#125;<br/>customer.experience = &quot;memorable&quot;;</code>
    </div>
  );
}

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
        <div className="wascik-site">
          <CodeBackdrop />
          <header className="wascik-nav">
            <a href="#top" className="wascik-brand" aria-label="WASCIK home">
              <Image className="wascik-logo wascik-logo-nav" src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} priority />
              <span className="brand-words">WASCIK <small>APP DEVELOPMENT</small></span>
            </a>
            <nav aria-label="Portfolio navigation">
              <a href="#services">Services</a>
              <a href="/sample-project">Our work</a>
              <a href="#contact">Contact</a>
            </nav>
          </header>

          <section id="top" className="wascik-hero">
            <div className="circuit-glow circuit-one" />
            <div className="circuit-glow circuit-two" />
            <div className="wascik-hero-copy">
              <p className="wascik-eyebrow">WE BUILD MORE THAN WEBSITES</p>
              <h1><Image className="wascik-logo wascik-logo-hero" src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} priority /><em>App Development</em></h1>
              <p className="wascik-tagline">Powerful digital solutions for local businesses.</p>
              <p className="wascik-intro">
                We help local businesses look professional, reach more customers, and
                work smarter online. From websites and mobile apps to e-commerce,
                branding, and upcoming AI assistants, we turn your ideas into useful
                digital tools built around the way your business actually works.
              </p>
              <div className="wascik-actions">
                <a href="#contact" className="wascik-cta primary">Start My Project</a>
                <a href="/sample-project" className="wascik-cta secondary">View Our Work</a>
              </div>
              <div className="wascik-trust"><span>✓ Mobile-first</span><span>✓ Custom-built</span><span>✓ Local support</span></div>
            </div>

            <div className="wascik-portrait-wrap">
              <div className="portrait-halo" />
              <Image
                src="/michael-wascik-full-v2.png"
                alt="Michael, founder and developer at WASCIK App Development"
                width={910}
                height={1728}
                priority
                className="wascik-portrait"
              />
              <div className="founder-message">
                <span>A MESSAGE FROM MICHAEL</span>
                <p>Your business deserves technology that feels powerful, personal, and built for where you&apos;re going next.</p>
              </div>
              <div className="founder-card"><strong>Michael Lewis</strong><span>Founder &amp; Developer</span></div>
            </div>

            <aside className="ai-card">
              <div className="ai-orb">AI</div>
              <div><strong>Need help getting started?</strong><p>Tell us what your business needs. We&apos;ll help shape the website, app, store, or AI solution that fits it.</p></div>
              <a href="#contact">Let&apos;s talk →</a>
            </aside>
          </section>

          <section id="services" className="wascik-services">
            <p className="wascik-eyebrow">WHAT WE BUILD</p>
            <h2>Your business. Upgraded.</h2>
            <div className="service-grid">
              {portfolioServices.map((service, index) => (
                <article className="service-card" key={service.title}>
                  <div className="card-circuit" aria-hidden="true"><i/><i/><i/><b/><b/></div>
                  <div className="service-visual"><ServiceIcon type={service.icon} /><i>0{index + 1}</i></div>
                  <h3>{service.title}</h3><p>{service.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <AIAssistantDemo />

          <section className="promo-band">
            <div><p>90-DAY WEBSITE SPECIAL</p><strong><sup>$</sup>324</strong><span>one-page business website</span></div>
            <ul><li>Custom mobile-friendly design</li><li>Business information and services</li><li>Contact and call buttons</li><li>Two revision rounds</li></ul>
            <a href="#contact" className="wascik-cta primary">Claim This Offer</a>
          </section>

          <section id="contact" className="wascik-contact">
            <div><p className="wascik-eyebrow">READY WHEN YOU ARE</p><h2>Let&apos;s build something powerful.</h2><p>Serving Central Arkansas and businesses everywhere.</p></div>
            <div className="contact-links">
              <a href="tel:+15015782259">Call Michael<br/><strong>(501) 578-2259</strong></a>
              <a href="mailto:LewisMike0435@gmail.com">Send an email<br/><strong>LewisMike0435@gmail.com</strong></a>
            </div>
          </section>

          <footer className="wascik-footer">© 2026 WASCIK App Development · We Are So Close, It&apos;s Crazy.</footer>
        </div>
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
      
       <div className="portfolio-return-section">
        <Link href="/" className="portfolio-return-button">
         ← Back to WASCIK Portfolio
        </Link>
       </div>

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
