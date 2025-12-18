'use client';

import { type FallbackProps } from 'react-error-boundary';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export function ProjectsErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={resetErrorBoundary}>
          Retry
        </Button>
      }
    >
      {Error.isError(error) ? `${error}` : 'Failed to load projects'}
    </Alert>
  );
}
