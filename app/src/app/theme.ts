'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-sans)',
    button: {
      textTransform: 'initial',
    },
  },
  components: {
    MuiStack: {
      defaultProps: {
        // https://mui.com/material-ui/react-stack/#flexbox-gap
        useFlexGap: true,
      },
    },
  },
});
