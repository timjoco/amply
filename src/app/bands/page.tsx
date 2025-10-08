// app/bands/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BandsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Bands</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Coming soon. Create and manage your bands here.
      </p>
    </div>
  );
}
