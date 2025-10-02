import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

// This page reads client-side search params; don't prerender.
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackClient />
    </Suspense>
  );
}
