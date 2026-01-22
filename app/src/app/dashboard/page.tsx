import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { AiProviderBanner } from './AiProviderBanner';
import { NewProjectButton } from './NewProjectButton';
import { ProjectCards } from './ProjectCards';
import { ProjectsErrorBoundary } from './ProjectsErrorBoundary';
import { ExampleCreatableCombobox } from './ExampleCreatableCombobox';
import { ExampleCombobox } from './ExampleCombobox';
import { ComboboxExample, ComboboxMultiple } from './ComboboxExample';

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl">Welcome back</h1>
      <p>Continue your GDPR-compliant Reddit research or start a new project</p>
    </div>
  );
}

const disabled = Math.random() < 2;

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <div className="flex flex-col gap-6">
        <Header />
        <AiProviderBanner />
        <div>
          <NewProjectButton />
        </div>
        {!disabled && (
          <ProjectsErrorBoundary>
            <Grid container spacing={3}>
              <ProjectCards />
            </Grid>
          </ProjectsErrorBoundary>
        )}
        <div className="w-fit">
          <ExampleCombobox />
        </div>

        <ExampleCreatableCombobox />
        <div className="w-fit">
          <ComboboxExample />
          <ComboboxMultiple />
        </div>
      </div>
    </Container>
  );
}
