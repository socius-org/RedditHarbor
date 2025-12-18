'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AiProviderBanner } from './AiProviderBanner';
import { GridItem } from './GridItem';
import { NewProjectCard } from './NewProjectCard';
import { ProjectCards } from './ProjectCards';
import { ProjectsErrorFallback } from './ProjectsErrorFallback';

function Header() {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back
      </Typography>
      <Typography variant="body1">
        Continue your GDPR-compliant Reddit research or start a new project
      </Typography>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
        <Grid container spacing={3}>
          <ErrorBoundary FallbackComponent={ProjectsErrorFallback}>
            <Suspense fallback={null}>
              <ProjectCards />
              <GridItem>
                <NewProjectCard />
              </GridItem>
            </Suspense>
          </ErrorBoundary>
        </Grid>
      </Stack>
    </Container>
  );
}
