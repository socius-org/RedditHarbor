'use client';

import type { SyntheticEvent } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Project } from '../actions/createProject';
import { GridItem } from './GridItem';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function ProjectCard({ project }: { project: Project }) {
  const { title, createdAt } = project;

  function preventRipple(event: SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea sx={{ height: '100%' }}>
        <Stack sx={{ height: '100%' }}>
          <CardHeader
            action={
              <IconButton
                aria-label="Project menu"
                onMouseDown={preventRipple}
                onTouchStart={preventRipple}
                onClick={() => {
                  // TODO
                }}
              >
                <MoreVertIcon />
              </IconButton>
            }
            title={title}
            subheader={`Created ${dateFormatter.format(new Date(createdAt))}`}
          />
          <CardContent sx={{ flex: 1 }}>{/* TODO */}</CardContent>
        </Stack>
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
