'use client';

import { useState, type SyntheticEvent } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import type { Project } from '../actions/createProject';
import { GridItem } from './GridItem';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

type ProjectCardProps = {
  onDelete: (project: Project) => void;
  project: Project;
};

function ProjectCard({ onDelete, project }: ProjectCardProps) {
  const { title, createdAt } = project;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  function preventRipple(event: SyntheticEvent) {
    event.stopPropagation();
  }

  function handleCloseMenu() {
    setAnchorEl(null);
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
                onClick={(event) => {
                  setAnchorEl(event.currentTarget);
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
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu} disabled>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(project);
            handleCloseMenu();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
}

export function ProjectCards() {
  const [projects, { deleteProject }] = useProjects();

  return projects.map((project) => (
    <GridItem key={project.id}>
      <ProjectCard onDelete={deleteProject} project={project} />
    </GridItem>
  ));
}
