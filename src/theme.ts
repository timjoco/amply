'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // ensures default MUI components adapt
    primary: {
      main: '#6a1b9a', // purple
    },
    secondary: {
      main: '#ffffff', // white for accents
    },
    background: {
      default: '#200934', // plum background
      paper: '#111111', // slightly lighter for cards/app bars
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
});

export default theme;
