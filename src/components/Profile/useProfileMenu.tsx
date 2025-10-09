'use client';

import { useCallback, useRef, useState } from 'react';

export function useProfileMenu() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  return { open, anchorEl: anchorRef.current, handleOpen, handleClose };
}
