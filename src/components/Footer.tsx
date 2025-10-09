// components/Footer.tsx
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // placeholder for TikTok, swap if you have one
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';

const sections = [
  {
    title: 'Get Started',
    links: [
      { href: '/download', label: 'Download Amplee' },
      { href: '/pricing', label: 'Pricing & Plans' },
      { href: '/import', label: 'Import Data' },
      { href: '/support', label: 'Get Support' },
    ],
  },
  {
    title: 'Discover Amplee',
    links: [
      { href: '/about', label: 'About' },
      { href: '/for-bands', label: 'For Bands' },
      { href: '/for-managers', label: 'For Managers' },
      { href: '/blog', label: 'Blog' },
      { href: '/originals', label: 'Originals' },
      { href: '/rising', label: 'Rising' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign up' },
      { href: '/redeem', label: 'Redeem Voucher' },
      { href: '/gift', label: 'Gift Card' },
      { href: '/settings', label: 'Manage Account' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/what-is-amplee', label: 'What is Amplee?' },
      { href: '/partners', label: 'Partners' },
      { href: '/careers', label: 'Careers' },
      { href: '/press', label: 'Press' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear(); // if you ever see hydration issues, pass this from a server component

  return (
    <Box
      component="footer"
      sx={(t) => ({
        mt: 'auto',
        bgcolor: '#131318',
        color: 'common.white',
        borderTop: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.16),
      })}
    >
      {/* Top content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={{ xs: 3, md: 6 }}>
          {sections.map((s) => (
            // @ts-expect-error -- MUI Grid typing quirk: item/breakpoint props are valid at runtime
            <Grid item xs={12} sm={6} md={3} key={s.title}>
              <Typography
                variant="subtitle2"
                sx={() => ({
                  mb: 1.5,
                  letterSpacing: 0.5,
                  color: alpha('#FFFFFF', 0.6),
                })}
              >
                {s.title}
              </Typography>
              <Stack spacing={1.25}>
                {s.links.map((l) => (
                  <Typography
                    key={l.label}
                    component={Link}
                    href={l.href}
                    prefetch={false}
                    sx={() => ({
                      textDecoration: 'none',
                      color: alpha('#FFFFFF', 0.9),
                      '&:hover': { color: '#FFFFFF' },
                    })}
                  >
                    {l.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        {/* Tagline */}
        <Typography
          variant="body2"
          sx={() => ({
            mt: { xs: 4, md: 6 },
            color: alpha('#FFFFFF', 0.6),
            maxWidth: 900,
          })}
        >
          Amplee is a band-first, fan-centered platform that brings schedules,
          shows, members, and assets together—so you can spend less time
          coordinating and more time making music.
        </Typography>

        {/* Social row */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
          <IconButton
            aria-label="X"
            size="small"
            color="inherit"
            href="https://x.com"
            target="_blank"
            rel="noopener"
          >
            <XIcon />
          </IconButton>
          <IconButton
            aria-label="Instagram"
            size="small"
            color="inherit"
            href="https://instagram.com"
            target="_blank"
            rel="noopener"
          >
            <InstagramIcon />
          </IconButton>
          <IconButton
            aria-label="Facebook"
            size="small"
            color="inherit"
            href="https://facebook.com"
            target="_blank"
            rel="noopener"
          >
            <FacebookIcon />
          </IconButton>
          <IconButton
            aria-label="YouTube"
            size="small"
            color="inherit"
            href="https://youtube.com"
            target="_blank"
            rel="noopener"
          >
            <YouTubeIcon />
          </IconButton>
          <IconButton
            aria-label="TikTok"
            size="small"
            color="inherit"
            href="#"
            rel="noopener"
          >
            <MusicNoteIcon />
          </IconButton>
        </Stack>
      </Container>

      <Divider
        sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.16) })}
      />

      {/* Legal strip */}
      <Container
        maxWidth="lg"
        sx={{
          py: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: { xs: 'center', md: 'space-between' },
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © {year} Amplee
        </Typography>

        <Stack
          direction="row"
          spacing={3}
          sx={{ a: { textDecoration: 'none', color: 'text.secondary' } }}
        >
          <Typography component={Link} href="/privacy" variant="caption">
            Privacy Notice
          </Typography>
          <Typography component={Link} href="/terms" variant="caption">
            Terms & Conditions
          </Typography>
          <Typography component={Link} href="/cookies" variant="caption">
            Cookie Settings
          </Typography>
          <Typography component={Link} href="/accessibility" variant="caption">
            Accessibility
          </Typography>
          <Typography component={Link} href="/contact" variant="caption">
            Contact
          </Typography>
          {/* Stub language picker (replace later with <Select/>) */}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            English — English (US)
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
