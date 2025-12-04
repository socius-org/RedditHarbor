'use client';

import { useRef, useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { Project } from '../actions/createProject';
import { GridItem } from './GridItem';
import { ProjectDialogContent, type ProjectDialogContentHandle } from './NewProjectCard';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function DeleteConfirmDialog({
  open,
  projectTitle,
  onClose,
  onConfirm,
}: {
  open: boolean;
  projectTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete project</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete &ldquo;{projectTitle}&rdquo;? This action cannot be
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

function ProjectCard({ project }: { project: Project }) {
  const { id, title, createdAt } = project;
  const [, { deleteProject }] = useProjects();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const editDialogContentRef = useRef<ProjectDialogContentHandle>(null);

  function handleMenuClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleEditClick() {
    handleMenuClose();
    setEditDialogOpen(true);
  }

  function handleDeleteClick() {
    handleMenuClose();
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    deleteProject(id);
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardActionArea sx={{ height: '100%' }}>
          <CardContent sx={{ height: '100%', pr: 6 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="textSecondary">
              Created {dateFormatter.format(new Date(createdAt))}
            </Typography>
          </CardContent>
        </CardActionArea>
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Card>

      <Dialog
        fullWidth
        open={editDialogOpen}
        onClose={() => {
          if (editDialogContentRef.current?.getIsPending()) {
            return;
          }
          setEditDialogOpen(false);
        }}
      >
        <DialogTitle>Edit project</DialogTitle>
        <ProjectDialogContent
          project={project}
          onClose={() => {
            setEditDialogOpen(false);
          }}
          ref={editDialogContentRef}
        />
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        projectTitle={title}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </>
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
