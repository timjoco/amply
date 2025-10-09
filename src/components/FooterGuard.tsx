'use client';

import Footer from '@/components/Footer';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function FooterGuard() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Hide footer while checking (prevents flicker) and when authed
  if (authed !== false) return null;
  return <Footer />;
}
