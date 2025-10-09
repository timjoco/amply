// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7C3AED' }, // purple
    secondary: { main: '#A855F7' }, // lavender
    background: {
      default: '#0B0B10', // page background
      paper: '#0F1016', // card background
    },
  },
  shape: { borderRadius: 12 },
});
export default theme;
