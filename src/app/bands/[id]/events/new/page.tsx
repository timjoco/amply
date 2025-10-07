export default function NewEventPlaceholder({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>New Event</h1>
      <p>Event creation coming soon.</p>
      <code>band id: {params.id}</code>
    </main>
  );
}
