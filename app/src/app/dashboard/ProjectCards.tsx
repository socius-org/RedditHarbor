'use client';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Project } from '../actions/createProject';
import { GridItem } from './GridItem';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function ProjectCard({ project }: { project: Project }) {
  const { title, createdAt } = project;

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%' }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="textSecondary">
            Created {dateFormatter.format(new Date(createdAt))}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function ProjectCards() {
  const [projects] = useProjects();

  return projects.map((project) => (
    <GridItem key={project.id}>
      <ProjectCard project={project} />
    </GridItem>
  ));
}
