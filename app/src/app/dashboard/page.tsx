'use client';

import { useState, type ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Project } from '../actions/createProject';
import { AiProviderBanner } from './AiProviderBanner';
import { NewProjectCard } from './NewProjectCard';

const dateFormatter = new Intl.DateTimeFormat(/* locales */ undefined, { dateStyle: 'medium' });

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

function ProjectCard({ project }: { project: Project }) {
  const { title, createdAt } = project;

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%' }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="textSecondary">Created {dateFormatter.format(createdAt)}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function GridItem({ children }: { children: ReactNode }) {
  return <Grid size={{ xs: 12, sm: 6, lg: 4 }}>{children}</Grid>;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);

  function handleCreate(project: Project) {
    setProjects((prev) => [...prev, project]);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
        <Grid container spacing={3}>
          {projects.map((project) => (
            <GridItem key={project.id}>
              <ProjectCard project={project} />
            </GridItem>
          ))}
          <GridItem>
            <NewProjectCard onCreate={handleCreate} />
          </GridItem>
        </Grid>
      </Stack>
    </Container>
  );
}
