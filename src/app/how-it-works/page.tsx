// src/app/how-it-works/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works — Amply',
  description:
    'See how bands and venues use Amply to turn availability into confirmed gigs.',
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-white">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">How it works</h1>
        <p className="mt-3 text-white/70">
          Amplify your gigs. Simplify your bookings. Get connected. Get booked.
          Play the gig. Get paid.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup?role=band"
            className="rounded-xl bg-white text-black px-5 py-2.5 font-medium hover:bg-white/90"
          >
            I’m a Band
          </Link>
          <Link
            href="/signup?role=venue"
            className="rounded-xl border border-white/20 px-5 py-2.5 font-medium hover:bg-white/10"
          >
            I’m a Venue
          </Link>
        </div>
      </section>

      {/* Split flows */}
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Bands */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">For Bands</h2>
          <ol className="mt-4 space-y-3 text-white/80">
            <li>
              <span className="font-medium text-white">
                1) Create your profile:
              </span>{' '}
              name, genre, city, typical draw, links to Spotify/YouTube/IG.
            </li>
            <li>
              <span className="font-medium text-white">
                2) Add availability:
              </span>{' '}
              choose the dates you can play.
            </li>
            <li>
              <span className="font-medium text-white">
                3) Receive requests:
              </span>{' '}
              venues send you booking invites for a specific date.
            </li>
            <li>
              <span className="font-medium text-white">
                4) Accept or decline:
              </span>{' '}
              one click confirms the show.
            </li>
          </ol>
          <div className="mt-6">
            <Link
              href="/signup?role=band"
              className="inline-block rounded-lg bg-white px-4 py-2 font-semibold text-black hover:bg-white/90"
            >
              Start as a Band
            </Link>
          </div>
        </div>

        {/* Venues */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">For Venues</h2>
          <ol className="mt-4 space-y-3 text-white/80">
            <li>
              <span className="font-medium text-white">
                1) Create your venue:
              </span>{' '}
              capacity, genre preferences, city, payout notes.
            </li>
            <li>
              <span className="font-medium text-white">2) Find bands:</span>{' '}
              filter by genre, draw, and availability.
            </li>
            <li>
              <span className="font-medium text-white">3) Send a request:</span>{' '}
              pick the date you want them to play.
            </li>
            <li>
              <span className="font-medium text-white">
                4) Get confirmation:
              </span>{' '}
              track status from pending to confirmed.
            </li>
          </ol>
          <div className="mt-6">
            <Link
              href="/signup?role=venue"
              className="inline-block rounded-lg border border-white/20 px-4 py-2 font-semibold hover:bg-white/10"
            >
              Start as a Venue
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline / simple explainer */}
      <section className="mt-14">
        <h3 className="text-lg font-semibold">
          From discovery to confirmed gig
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            {
              label: 'Discover',
              desc: 'Venues find matching bands by genre, draw & city.',
            },
            {
              label: 'Request',
              desc: 'Pick a date and send a booking invite in one click.',
            },
            {
              label: 'Confirm',
              desc: 'Bands accept or decline; status updates instantly.',
            },
            {
              label: 'Play & get paid',
              desc: 'Show appears on both calendars. Payments come next.',
            },
          ].map((step) => (
            <div
              key={step.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="text-sm font-semibold">{step.label}</div>
              <div className="mt-1 text-sm text-white/70">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <h3 className="text-lg font-semibold">FAQ</h3>
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">Is Amply free to start?</div>
            <p className="mt-1 text-white/70 text-sm">
              Yes. V1 focuses on getting bands and venues connected. Pricing and
              payments will arrive in a later release.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">How do bookings work?</div>
            <p className="mt-1 text-white/70 text-sm">
              Venues send a request for a specific date. Bands accept or
              decline. Confirmed gigs show up on both dashboards.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium">
              What about payments and contracts?
            </div>
            <p className="mt-1 text-white/70 text-sm">
              V1 keeps it simple. Payments/contracts are on the roadmap once the
              core matching flow is nailed.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-14 text-center">
        <h4 className="text-2xl font-semibold">Ready to amplify your gigs?</h4>
        <p className="mt-2 text-white/70">
          Pick your side and get set up in minutes.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/signup?role=band"
            className="rounded-xl bg-white text-black px-5 py-2.5 font-medium hover:bg-white/90"
          >
            I’m a Band
          </Link>
          <Link
            href="/signup?role=venue"
            className="rounded-xl border border-white/20 px-5 py-2.5 font-medium hover:bg-white/10"
          >
            I’m a Venue
          </Link>
        </div>
      </section>
    </main>
  );
}
