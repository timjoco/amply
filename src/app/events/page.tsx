// app/events/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function EventsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Events</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Coming soon. Your master list of events will live here.
      </p>
    </div>
  );
}
