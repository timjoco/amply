import type { CreateBandParams, CreatedBand } from '@/lib/bands/createBand';
import { createBand as createBandSvc } from '@/lib/bands/createBand';
import { useCallback, useState } from 'react';

function toMsg(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error';
  }
}

export function useCreateBand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBand = useCallback(
    async (params: CreateBandParams): Promise<CreatedBand | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await createBandSvc(params);
        return res;
      } catch (e) {
        const msg = toMsg(e);
        console.error('[useCreateBand]', e); // you’ll now see a readable message
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createBand, loading, error, resetError: () => setError(null) };
}
