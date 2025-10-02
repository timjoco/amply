'use client';

// src/app/how-it-works/page.tsx
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // ✅ classic Grid (supports container/item)
import NextLink from 'next/link';

export default function HowItWorksPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      {/* HERO */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 3,
          background: (t) =>
            t.palette.mode === 'dark'
              ? `linear-gradient(180deg, rgba(106,27,154,0.15), rgba(106,27,154,0.05))`
              : `linear-gradient(180deg, rgba(106,27,154,0.10), rgba(106,27,154,0.03))`,
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Chip
            label="How it works"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: -0.5,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Simplify the chaos. Amplify the music.
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 820 }}
          >
            Amplee puts every moving part of your band in one place: scheduling,
            subs, chord sheets, EPKs, and a shared space to coordinate shows.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ pt: 2 }}
          >
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              size="large"
            >
              Get started
            </Button>
            <Button
              component={NextLink}
              href="/onboarding"
              variant="outlined"
              size="large"
            >
              Try the onboarding
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 3-STEP WORKFLOW */}
      <Box sx={{ mt: { xs: 6, md: 10 } }}>
        <Typography
          variant="h4"
          component="h2"
          fontWeight={800}
          textAlign="center"
        >
          Your workflow in three steps
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 1, mb: { xs: 3, md: 6 } }}
        >
          From first login to first gig—here’s how Amplee slots into your
          routine.
        </Typography>

        <Grid container spacing={3}>
          {[
            {
              step: '1',
              title: 'Create your band',
              icon: <PeopleAltIcon />,
              points: [
                'Name, location, genre, and logo',
                'Invite members with one click',
                'Assign roles: admin, editor, member',
              ],
            },
            {
              step: '2',
              title: 'Plan and prepare',
              icon: <CalendarMonthIcon />,
              points: [
                'Add shows and rehearsals',
                'Share chord sheets & stage plots',
                'Collect availability and assign subs',
              ],
            },
            {
              step: '3',
              title: 'Collaborate & perform',
              icon: <ForumIcon />,
              points: [
                'Central chat per event',
                'EPK at the ready for promoters',
                'Everyone stays on the same page',
              ],
            },
          ].map(({ step, title, icon, points }) => (
            // @ts-expect-error TS is complaining about Grid props but it's safe here
            <Grid component="div" key={title} item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: (t) =>
                          t.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        fontWeight: 700,
                      }}
                    >
                      {step}
                    </Paper>
                    <Typography variant="h6" fontWeight={700}>
                      {title}
                    </Typography>
                    <Box sx={{ ml: 'auto', opacity: 0.8 }}>{icon}</Box>
                  </Stack>
                  <List dense sx={{ mt: 1 }}>
                    {points.map((p) => (
                      <ListItem key={p} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={p} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
