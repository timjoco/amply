export default function BandPlaceholder({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Band</h1>
      <p>Band page coming soon.</p>
      <code>id: {params.id}</code>
    </main>
  );
}
