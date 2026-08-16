import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PublishedAffiliateProducts from "../PublishedAffiliateProducts";

export const metadata: Metadata = {
  title: "Concert Tickets & Upcoming Events | WASCIK Affiliate Services",
  description: "Explore upcoming concerts and event tickets through WASCIK's TicketNetwork affiliate page.",
  alternates: {
    canonical: "/affiliate-services/ticketnetwork",
  },
  openGraph: {
    type: "website",
    url: "/affiliate-services/ticketnetwork",
    title: "Concert Tickets & Upcoming Events | WASCIK Affiliate Services",
    description: "Explore upcoming concerts and event tickets through WASCIK's TicketNetwork affiliate page.",
  },
};

const ticketLink = "https://goto.ticketnetwork.com/c/7587435/120057/2322";

const events = [
  { artist: "Chris Stapleton", tour: "All-American Road Show with Zach Top & Allen Stone", date: "Friday, August 14, 2026", time: "7:30 PM", venue: "Fenway Park", location: "Boston, Massachusetts", image: "/affiliate/ticketnetwork/chris-stapleton.webp", genre: "Country" },
  { artist: "Kane Brown", tour: "OC Smoke Show with Dustin Lynch & LoCash", date: "Saturday, August 15, 2026", time: "1:00 PM", venue: "Rancho Mission Viejo Riding Park", location: "San Juan Capistrano, California", image: "/affiliate/ticketnetwork/kane-brown.webp", genre: "Country" },
  { artist: "Guns N’ Roses", tour: "Guns N’ Roses with Public Enemy", date: "Sunday, August 16, 2026", time: "6:25 PM", venue: "Busch Stadium", location: "St. Louis, Missouri", image: "/affiliate/ticketnetwork/guns-n-roses.webp", genre: "Rock" },
  { artist: "Pitbull", tour: "Pitbull with Lil Jon", date: "Wednesday, August 19, 2026", time: "8:00 PM", venue: "Jiffy Lube Live", location: "Bristow, Virginia", image: "/affiliate/ticketnetwork/pitbull.webp", genre: "Pop & Hip-Hop" },
  { artist: "Garth Brooks", tour: "Garth Brooks Live in Concert", date: "Thursday, August 20, 2026", time: "7:30 PM", venue: "Gainbridge Fieldhouse", location: "Indianapolis, Indiana", image: "/affiliate/ticketnetwork/garth-brooks.webp", genre: "Country" },
  { artist: "Garth Brooks", tour: "Garth Brooks Live in Concert", date: "Friday, August 21, 2026", time: "8:00 PM", venue: "Gainbridge Fieldhouse", location: "Indianapolis, Indiana", image: "/affiliate/ticketnetwork/garth-brooks.webp", genre: "Country" },
  { artist: "Garth Brooks", tour: "Garth Brooks Live in Concert", date: "Saturday, August 22, 2026", time: "8:00 PM", venue: "Gainbridge Fieldhouse", location: "Indianapolis, Indiana", image: "/affiliate/ticketnetwork/garth-brooks.webp", genre: "Country" },
  { artist: "Garth Brooks", tour: "Garth Brooks Live in Concert", date: "Sunday, August 23, 2026", time: "2:00 PM", venue: "Gainbridge Fieldhouse", location: "Indianapolis, Indiana", image: "/affiliate/ticketnetwork/garth-brooks.webp", genre: "Country" },
  { artist: "Weezer", tour: "Weezer with The Shins & Silversun Pickups", date: "Tuesday, October 6, 2026", time: "7:00 PM", venue: "Nationwide Arena", location: "Columbus, Ohio", image: "/affiliate/ticketnetwork/weezer.webp", genre: "Alternative Rock" },
  { artist: "Journey", tour: "Journey Live in Concert", date: "Thursday, October 8, 2026", time: "7:30 PM", venue: "BOK Center", location: "Tulsa, Oklahoma", image: "/affiliate/ticketnetwork/journey.webp", genre: "Classic Rock" },
];

export default function TicketNetworkPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090510] text-white">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_15%_12%,rgba(236,72,153,.24),transparent_30%),radial-gradient(circle_at_84%_46%,rgba(124,58,237,.22),transparent_30%)]" />
      <header className="relative z-10 border-b border-fuchsia-950 bg-[#090510]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/affiliate-services" className="flex min-w-0 items-center gap-3"><Image src="/wascik-logo-v2.png?v=20260809" alt="WASCIK" width={1812} height={868} className="h-auto w-32 object-contain sm:w-40" priority /><span className="hidden text-sm font-black uppercase tracking-[.15em] text-fuchsia-100 sm:block">Affiliate Services</span></Link>
          <Link href="/affiliate-services" className="rounded-lg border border-fuchsia-700 px-4 py-2 text-sm font-bold text-fuchsia-100 transition hover:border-fuchsia-300">← All Affiliate Picks</Link>
        </div>
      </header>

      <section className="relative z-10 px-5 py-16 md:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.3em] text-fuchsia-300">Live music & entertainment</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl">Find your next<br /><span className="text-fuchsia-400">unforgettable night.</span></h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">Browse a rotating selection of upcoming concerts, then use the WASCIK TicketNetwork link to search current listings, compare available seats, and confirm event details.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href={ticketLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-fuchsia-400 px-8 py-4 text-center font-black text-slate-950 transition hover:bg-fuchsia-300">Search TicketNetwork ↗</a><a href="#upcoming-events" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-violet-400 px-8 py-4 text-center font-black text-violet-100 transition hover:bg-violet-500/10">See Featured Events ↓</a></div>
        </div>
      </section>

      <section id="upcoming-events" className="relative z-10 border-y border-fuchsia-950 bg-[#12091d]/85 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-fuchsia-300">Upcoming concert spotlight</p>
          <h2 className="mt-3 text-4xl font-black sm:text-5xl">Upcoming shows worth checking out</h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">Schedules were reviewed on August 13, 2026. Events, performers, times, ticket inventory, and pricing can change, so verify every detail on TicketNetwork before ordering.</p>
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article key={`${event.artist}-${event.date}`} className="flex h-full flex-col overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-[#1c0a28] to-[#090510] shadow-[0_24px_70px_rgba(0,0,0,.34)]">
                <div className="relative"><Image src={event.image} alt={`${event.artist} performing live`} width={1200} height={675} className="aspect-video h-auto w-full object-cover" /><span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-fuchsia-100 backdrop-blur">{event.genre}</span></div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-sm font-black uppercase tracking-[.16em] text-fuchsia-300">{event.date}</p>
                  <h3 className="mt-3 text-3xl font-black leading-tight">{event.artist}</h3>
                  <p className="mt-3 font-bold leading-6 text-violet-100">{event.tour}</p>
                  <div className="mt-5 space-y-2 text-sm leading-6 text-slate-300"><p>🕒 {event.time}</p><p>📍 {event.venue}</p><p>{event.location}</p></div>
                  <div className="mt-auto pt-7"><a href={ticketLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-fuchsia-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-fuchsia-300">Find Tickets →</a><p className="mt-3 text-center text-xs leading-5 text-slate-500">Affiliate link · Search TicketNetwork for the artist or event.</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublishedAffiliateProducts pagePath="/affiliate-services/ticketnetwork" />
      <section className="relative z-10 px-5 py-14 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-300/25 bg-yellow-300/[.06] p-7 sm:p-9"><p className="font-black text-yellow-200">Ticket and affiliate disclosure</p><p className="mt-3 leading-7 text-slate-400">WASCIK may earn a commission from qualifying purchases made through TicketNetwork links on this page, at no additional cost to you. TicketNetwork is a resale marketplace, not the venue or box office, and ticket prices may be above or below face value. Event schedules, performers, availability, seat locations, fees, and prices may change. Review the merchant&apos;s current listing and purchase terms before ordering.</p></div>
        <div className="mx-auto mt-8 max-w-4xl text-center"><a href={ticketLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-fuchsia-400 px-8 py-4 text-center font-black text-slate-950 transition hover:bg-fuchsia-300 sm:w-auto">Browse All TicketNetwork Events ↗</a></div>
      </section>
      <footer className="relative z-10 border-t border-fuchsia-950 bg-[#050208] px-5 py-7 text-center text-sm text-slate-500">© 2026 WASCIK™ Affiliate Services · WASCIK™ is a trademark of Michael Lewis.</footer>
    </main>
  );
}
