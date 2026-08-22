"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomepageWebsiteOffer() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <section className="border-b border-cyan-300/25 bg-slate-950 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Introductory website special</p>
          <p className="mt-1 font-bold">
            Need a professional business website? <span className="text-cyan-300">Get started for $324.</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <Link
            href="/start-project"
            className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          >
            See the $324 Offer
          </Link>
          <a
            href="mailto:LewisMike0435@gmail.com?subject=Question%20about%20a%20WASCIK%20website"
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ask a Question
          </a>
        </div>
      </div>
    </section>
  );
}
