// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="py-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Book bands faster.{' '}
          <span className="text-white/60">Fill your calendar.</span>
        </h1>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">
          Amply connects bands and venues. Set availability, find the right fit,
          send a request, and get confirmed—fast.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/signup?role=band"
            className="rounded-xl bg-white text-black px-5 py-2.5 font-medium hover:bg-white/90"
          >
            I’m a Band
          </a>
          <a
            href="/signup?role=venue"
            className="rounded-xl border border-white/20 px-5 py-2.5 font-medium hover:bg-white/10"
          >
            I’m a Venue
          </a>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Bands',
            body: 'Create a profile, set availability, get booking invites.',
          },
          {
            title: 'Venues',
            body: 'Search by genre/draw/city and request a band for a date.',
          },
          {
            title: 'Confirm',
            body: 'Bands accept/decline. Everyone sees status instantly.',
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-white/10 p-6 bg-white/5"
          >
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <p className="mt-2 text-white/70">{c.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
