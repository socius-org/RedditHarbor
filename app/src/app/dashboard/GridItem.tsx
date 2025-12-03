import type { ReactNode } from 'react';
import Grid from '@mui/material/Grid';

export function GridItem({ children }: { children: ReactNode }) {
  return <Grid size={{ xs: 12, sm: 6, lg: 4 }}>{children}</Grid>;
}
