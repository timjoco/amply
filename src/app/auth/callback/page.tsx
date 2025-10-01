import { Suspense } from 'react';
import CallbackClient from './client';

export const dynamic = 'force-dynamic'; // avoid prerendering issues
// optional: export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-md p-6">Signing you in…</div>}
    >
      <CallbackClient />
    </Suspense>
  );
}
