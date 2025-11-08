'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
    button: {
      textTransform: 'initial',
    },
  },
});
