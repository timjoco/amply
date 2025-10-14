// src/theme.ts
import { alpha, createTheme } from '@mui/material/styles';

// Enable custom Paper variant: <Paper variant="glass" />
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    glass: true;
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7C3AED' },
    secondary: { main: '#A855F7' },
    background: {
      default: '#0B0B10',
      paper: '#0F1016',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      variants: [
        {
          props: { variant: 'glass' },
          style: ({ theme }) => {
            const base = theme.shape.borderRadius;
            const br = typeof base === 'number' ? base * 1.5 : base;

            return {
              borderRadius: br,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.22),
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
              backdropFilter: 'blur(6px)',
              boxShadow: `0 0 0 1px ${alpha(
                theme.palette.primary.main,
                0.12
              )}, 0 10px 30px rgba(0,0,0,.35)`,
            };
          },
        },
      ],
    },
  },
});

export default theme;
