import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { AiProviderBanner } from './AiProviderBanner';
import { GridItem } from './GridItem';
import { NewProjectCard } from './NewProjectCard';
import { ProjectCards } from './ProjectCards';
import { ProjectsErrorBoundary } from './ProjectsErrorBoundary';

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl">Welcome back</h1>
      <p>Continue your GDPR-compliant Reddit research or start a new project</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
        <ProjectsErrorBoundary>
          <Grid container spacing={3}>
            <ProjectCards />
            <GridItem>
              <NewProjectCard />
            </GridItem>
          </Grid>
        </ProjectsErrorBoundary>
      </Stack>
    </Container>
  );
}
