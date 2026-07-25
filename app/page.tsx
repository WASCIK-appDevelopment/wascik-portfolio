export default function Home() {

  return (

    <main className="min-h-screen bg-white text-slate-900">

      {/* Demonstration notice */}

      <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-slate-950">

        Portfolio demonstration website created by WASCIK App Development

      </div>

      {/* Header */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <a href="#home" className="flex items-center gap-3">

            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-xl font-bold text-amber-400">

              S

            </span>

            <span>

              <span className="block text-lg font-bold leading-tight text-slate-900">

                Summit Home Services

              </span>

              <span className="block text-xs text-slate-600">

                Reliable Work. Honest Service.

              </span>

            </span>

          </a>

          <nav

            aria-label="Main navigation"

            className="hidden items-center gap-6 lg:flex"

          >

            <a href="#home" className="font-medium hover:text-amber-600">

              Home

            </a>

            <a href="#services" className="font-medium hover:text-amber-600">

              Services

            </a>

            <a href="#about" className="font-medium hover:text-amber-600">

              About

            </a>

            <a href="#reviews" className="font-medium hover:text-amber-600">

              Reviews

            </a>

            <a href="#contact" className="font-medium hover:text-amber-600">

              Contact

            </a>

          </nav>

          <a

            href="#contact"

            className="hidden min-h-11 items-center justify-center rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400 sm:flex"

          >

            Free Estimate

          </a>

        </div>

      </header>

      {/* Hero section */}

      <section

        id="home"

        className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white"

      >

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:items-center lg:py-24">

          <div>

            <p className="mb-4 font-semibold uppercase tracking-widest text-amber-400">

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

                className="flex min-h-12 items-center justify-center rounded-lg bg-amber-500 px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-amber-400"

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

          {/* Temporary visual until project images are added */}

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl">

            <div className="flex min-h-72 flex-col justify-end rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-7 text-slate-950 sm:min-h-96">

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

      {/* Temporary sections for navigation */}

      <section id="services" className="scroll-mt-24 px-5 py-20">

        <div className="mx-auto max-w-7xl">

          <p className="font-semibold uppercase tracking-widest text-amber-600">

            Our services

          </p>

          <h2 className="mt-3 text-3xl font-bold">

            Practical help for homes and properties

          </h2>

        </div>

      </section>

      <section id="about" className="scroll-mt-24 bg-slate-100 px-5 py-20">

        <div className="mx-auto max-w-7xl">

          <h2 className="text-3xl font-bold">About Summit Home Services</h2>

        </div>

      </section>

      <section id="reviews" className="scroll-mt-24 px-5 py-20">

        <div className="mx-auto max-w-7xl">

          <h2 className="text-3xl font-bold">Sample customer reviews</h2>

        </div>

      </section>

      <section id="contact" className="scroll-mt-24 bg-slate-900 px-5 py-20 text-white">

        <div className="mx-auto max-w-7xl">

          <h2 className="text-3xl font-bold">Request a free estimate</h2>

          <p className="mt-3 text-slate-300">

            Demonstration contact form coming next.

          </p>

        </div>

      </section>

    </main>

  );

}