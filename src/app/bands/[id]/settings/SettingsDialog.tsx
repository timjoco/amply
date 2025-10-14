/* eslint-disable @typescript-eslint/no-explicit-any */
// app/bands/[id]/settings/SettingsDialog.tsx
'use client';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useRef, useState } from 'react';
import BandAvatarCard from './BandAvatarCard';
import BandBasicsCard from './BandBasicsCard';
import DangerZone from './DangerZone';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref
) {
  return <Slide direction="up" ref={ref} timeout={220} {...props} />;
});

type Props = {
  bandId: string;
  bandName: string;
  avatarPath?: string;
  /** Optional: forwarded only; no conditional rendering here */
  isAdmin?: boolean;
};

export default function SettingsDialog({
  bandId,
  bandName,
  avatarPath,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => router.push(`/bands/${bandId}`), 230);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Discord-y dark palette
  const BG = '#0B0A10'; // whole dialog bg
  const SURFACE = '#101117'; // right content pane
  const SURFACE_ALT = '#0E0F15'; // left rail
  const BORDER = 'rgba(255,255,255,0.10)';
  const TEXT = 'rgba(255,255,255,0.96)';
  const TEXT_DIM = 'rgba(255,255,255,0.72)';

  // Left rail items (two only)
  const sections = [
    { id: 'profile', label: 'Band Profile' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const onJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el || !scrollRef.current) return;
    const top = el.offsetTop - 12;
    scrollRef.current.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullScreen
      keepMounted
      BackdropProps={{
        sx: { backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.7)' },
      }}
      PaperProps={{
        sx: { bgcolor: BG, color: 'common.white' },
      }}
    >
      {/* Floating close (X) */}
      <Box
        sx={{
          position: 'fixed',
          right: 12,
          top: 12,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: TEXT_DIM,
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          sx={{
            color: TEXT,
            bgcolor: 'rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          minHeight: '100%',
        }}
      >
        {/* Left rail */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            bgcolor: SURFACE_ALT,
            borderRight: `1px solid ${BORDER}`,
            py: 2,
            px: 1.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: TEXT_DIM,
              px: 1,
              letterSpacing: 1,
              display: 'block',
              mb: 1.25,
            }}
          >
            {bandName}
          </Typography>
          <Stack spacing={0.5}>
            {sections.map((s) => (
              <Button
                key={s.id}
                onClick={() => onJump(s.id)}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  color: TEXT_DIM,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: TEXT,
                  },
                }}
              >
                {s.label}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Right content pane (no cards; plain sections with thin dividers) */}
        <Box
          ref={scrollRef}
          sx={{
            bgcolor: SURFACE,
            minHeight: '100%',
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 10 },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 8,
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            },

            // Neutralize any Card styles used inside the child components
            '& .MuiCard-root': {
              background: 'transparent',
              boxShadow: 'none',
              border: 0,
            },
            '& .MuiCardHeader-root': { px: 0 },
            '& .MuiCardContent-root': { px: 0 },
          }}
        >
          {/* Section: Band Profile (always rendered) */}
          <Box id="profile" sx={{ py: 2 }}>
            <Stack spacing={2}>
              <BandBasicsCard bandId={bandId} initialName={bandName} />
              <BandAvatarCard
                bandId={bandId}
                bandName={bandName}
                initialPath={avatarPath}
                compact
              />
            </Stack>
          </Box>

          <Divider sx={{ borderColor: BORDER, my: 2 }} />

          {/* Section: Danger Zone / Membership (always rendered; role handled internally) */}
          <Box id="danger" sx={{ py: 2 }}>
            <DangerZone bandId={bandId} bandName={bandName} />
          </Box>

          <Divider sx={{ borderColor: BORDER, mt: 2 }} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
