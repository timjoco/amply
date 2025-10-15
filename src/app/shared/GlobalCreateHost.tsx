'use client';

import GlobalCreate from '@/components/GlobalCreate';

/**
 * Always-mounted host so GlobalCreate can open from anywhere
 * via: window.dispatchEvent(new CustomEvent('global-create:open'))
 */
export default function GlobalCreateHost() {
  return <GlobalCreate />;
}
