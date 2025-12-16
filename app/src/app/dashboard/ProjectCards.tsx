'use client';

import { useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import type { Project } from '../actions/createProject';
import { GridItem } from './GridItem';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

type DeleteConfirmDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  project: Project;
};

function DeleteConfirmDialog({ open, onClose, onConfirm, project }: DeleteConfirmDialogProps) {
  return (
    <Dialog maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Delete project</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete &ldquo;{project.title}&rdquo;? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardActionArea
          component={Link}
          href={`/dashboard/project/${project.id}`}
          sx={{ height: '100%' }}
        >
          <Stack sx={{ height: '100%' }}>
            <CardHeader
              action={
                <IconButton
                  aria-label="Project menu"
                  onMouseDown={preventRipple}
                  onTouchStart={preventRipple}
                  onClick={(event) => {
                    // Prevent navigation
                    event.preventDefault();
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
      </Card>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu} disabled>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setDeleteDialogOpen(true);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        project={project}
        onClose={handleCloseDeleteDialog}
        onConfirm={() => {
          onDelete(project);
          handleCloseDeleteDialog();
        }}
      />
    </>
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
