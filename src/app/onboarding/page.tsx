'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Avatar,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import * as React from 'react';

// If you use @mui/lab, uncomment LoadingButton for nicer pending states.
// import { LoadingButton } from '@mui/lab';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Member = { email: string };

const steps = ['Account', 'Band', 'Members', 'Review'];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState<string>('');

  // Prefill account email from Supabase (optional).
  const [accountEmail, setAccountEmail] = React.useState('');
  React.useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setAccountEmail(data.user.email);
    };
    run();
  }, []);

  // Band info
  const [bandName, setBandName] = React.useState('');
  const [bandLocation, setBandLocation] = React.useState('');
  const [genre, setGenre] = React.useState('');
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string>('');

  // Members
  const [members, setMembers] = React.useState<Member[]>([]);
  const [memberInput, setMemberInput] = React.useState('');

  // Simple inline validation
  const emailRegex = React.useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const canContinueBand =
    bandName.trim().length >= 2 && bandName.trim().length <= 80;

  function handleLogoChange(file: File | null) {
    setLogoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoPreview('');
    }
  }

  function addMember() {
    const val = memberInput.trim();
    if (!val || !emailRegex.test(val)) return;
    if (members.some((m) => m.email.toLowerCase() === val.toLowerCase()))
      return;
    setMembers((prev) => [...prev, { email: val }]);
    setMemberInput('');
  }

  function removeMember(email: string) {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  }

  function next() {
    setError('');
    if (activeStep === 1 && !canContinueBand) {
      setError('Please enter a valid band name (2–80 characters).');
      return;
    }
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setError('');
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function handleCreate() {
    setStatus('submitting');
    setError('');

    try {
      const supabase = supabaseBrowser();

      // 1) Create band
      // Assumes a `bands` table: id (uuid default gen), name text, location text, genre text, logo_url text, created_by uuid
      const { data: userRes } = await supabase.auth.getUser();
      const currentUserId = userRes.user?.id;
      if (!currentUserId) throw new Error('Not authenticated.');

      let logoUrl: string | null = null;

      // 2) Optional upload to storage if you’ve set up a bucket like `band-assets`
      if (logoFile) {
        const filePath = `logos/${crypto.randomUUID()}-${logoFile.name}`;
        const { data: uploadRes, error: uploadErr } = await supabase.storage
          .from('band-assets')
          .upload(filePath, logoFile, { upsert: false });
        if (uploadErr) throw uploadErr;

        // If public, get public URL:
        const { data: publicUrl } = supabase.storage
          .from('band-assets')
          .getPublicUrl(uploadRes.path);
        logoUrl = publicUrl.publicUrl;
      }

      const { data: bandInsert, error: bandErr } = await supabase
        .from('bands')
        .insert({
          name: bandName.trim(),
          location: bandLocation.trim() || null,
          genre: genre.trim() || null,
          logo_url: logoUrl,
          created_by: currentUserId,
        })
        .select('id')
        .single();

      if (bandErr) throw bandErr;
      const bandId = bandInsert.id as string;

      // 3) Add current user as admin membership
      // Assumes `band_memberships` table with (band_id, user_id, role)
      const { error: memErr } = await supabase.from('band_memberships').insert({
        band_id: bandId,
        user_id: currentUserId,
        role: 'admin',
      });
      if (memErr) throw memErr;

      // 4) Create invitations for members (optional)
      // You might have an `invites` table with (band_id, email, created_by, status)
      if (members.length > 0) {
        const { error: invErr } = await supabase.from('invites').insert(
          members.map((m) => ({
            band_id: bandId,
            email: m.email,
            created_by: currentUserId,
            status: 'pending',
          }))
        );
        if (invErr) throw invErr;
      }

      setStatus('success');
      setActiveStep(steps.length - 1);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Something went wrong creating your band.';
      setStatus('error');
      setError(message);
    }
  }

  const isSubmitting = status === 'submitting';
  const isDone = status === 'success';

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Let’s get you set up
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {!!error && <Alert severity="error">{error}</Alert>}

          {/* STEP CONTENT */}
          {activeStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="h6">Account</Typography>
              <TextField
                label="Your email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                type="email"
                fullWidth
                helperText="This is where invites and notifications will be sent."
              />
              <Alert severity="info">
                You can update this later in Settings.
              </Alert>
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="h6">Band details</Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={logoPreview}
                  alt={bandName || 'Band logo'}
                  sx={{ width: 64, height: 64 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                >
                  Upload logo
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) =>
                      handleLogoChange(e.target.files?.[0] ?? null)
                    }
                  />
                </Button>
                {logoFile && (
                  <IconButton
                    aria-label="Remove logo"
                    onClick={() => handleLogoChange(null)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>

              <TextField
                label="Band name"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                fullWidth
                required
                error={!canContinueBand && bandName.length > 0}
                helperText={
                  !canContinueBand && bandName.length > 0
                    ? 'Band name must be 2–80 characters.'
                    : ' '
                }
              />
              <TextField
                label="Location (optional)"
                value={bandLocation}
                onChange={(e) => setBandLocation(e.target.value)}
                placeholder="Kansas City, MO"
                fullWidth
              />
              <TextField
                label="Genre (optional)"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Indie rock"
                fullWidth
              />
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={2}>
              <Typography variant="h6">Invite members (optional)</Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Member email"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMember();
                    }
                  }}
                  type="email"
                  fullWidth
                  error={!!memberInput && !emailRegex.test(memberInput)}
                  helperText={
                    !!memberInput && !emailRegex.test(memberInput)
                      ? 'Enter a valid email to add'
                      : 'Press Enter to add'
                  }
                />
                <Button
                  variant="contained"
                  onClick={addMember}
                  disabled={!memberInput || !emailRegex.test(memberInput)}
                >
                  Add
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {members.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No members added yet.
                  </Typography>
                ) : (
                  members.map((m) => (
                    <Chip
                      key={m.email}
                      label={m.email}
                      onDelete={() => removeMember(m.email)}
                      sx={{ m: 0.5 }}
                    />
                  ))
                )}
              </Stack>
              <Alert severity="info">
                Members will receive an invite after you finish onboarding.
              </Alert>
            </Stack>
          )}

          {activeStep === 3 && (
            <Stack spacing={2}>
              <Typography variant="h6">Review & create</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Row label="Email" value={accountEmail || '—'} />
                  <Divider flexItem />
                  <Row label="Band name" value={bandName || '—'} />
                  <Row label="Location" value={bandLocation || '—'} />
                  <Row label="Genre" value={genre || '—'} />
                  <Row
                    label="Members"
                    value={
                      members.length
                        ? members.map((m) => m.email).join(', ')
                        : '—'
                    }
                  />
                </Stack>
              </Paper>
              {status === 'error' && !!error && (
                <Alert severity="error">{error}</Alert>
              )}
              {status === 'success' && (
                <Alert icon={<CheckCircleIcon />} severity="success">
                  Band created! Redirect from here or continue to dashboard.
                </Alert>
              )}
            </Stack>
          )}

          {/* ACTIONS */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              startIcon={<ArrowBackIosNewIcon />}
              onClick={back}
              disabled={activeStep === 0 || isSubmitting || isDone}
              color="inherit"
            >
              Back
            </Button>

            {/* If using LoadingButton from @mui/lab, replace with it */}
            <Stack direction="row" spacing={1}>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={next}
                  disabled={isSubmitting}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={isSubmitting || isDone || !canContinueBand}
                >
                  {isSubmitting
                    ? 'Creating…'
                    : isDone
                    ? 'Created'
                    : 'Create band'}
                </Button>
              )}

              {/* Optional skip/exit */}
              <Button component={NextLink} href="/" color="secondary">
                Skip for now
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

/** Simple labeled row for the review card */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="body2" sx={{ minWidth: 120 }} color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );
}
