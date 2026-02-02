import Grid from '@mui/material/Grid';
import { AiProviderBanner } from './AiProviderBanner';
import { NewProjectButton } from './NewProjectButton';
import { ProjectCards } from './ProjectCards';
import { ProjectsErrorBoundary } from './ProjectsErrorBoundary';

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl">Welcome back</h1>
      <p>Continue your GDPR-compliant Reddit research or start a new project</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-300 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6">
        <Header />
        <AiProviderBanner />
        <div>
          <NewProjectButton />
        </div>
        <ProjectsErrorBoundary>
          <Grid container spacing={3}>
            <ProjectCards />
          </Grid>
        </ProjectsErrorBoundary>
      </div>
    </div>
  );
}
