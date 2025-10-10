import BandSheet from '@/components/Bands/BandSheet';

type Params = Promise<{ id: string }>;

export default async function BandPage({ params }: { params: Params }) {
  const { id } = await params;
  return <BandSheet bandId={id} />;
}
