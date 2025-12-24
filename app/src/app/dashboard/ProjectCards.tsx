'use client';

import {
  startTransition,
  useActionState,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type SyntheticEvent,
} from 'react';
import Link from 'next/link';
import { CircleAlert, Ellipsis } from 'lucide-react';
import { Alert, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx';
import MuiButton from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { updateProject, type Project } from '../actions/project';
import { db } from '../database';
import { GridItem } from './GridItem';
import { ProjectDialog } from './ProjectDialog';
import { useProjects } from './useProjects';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

type DeleteConfirmDialogContentHandle = { getIsPending: () => boolean };

type DeleteConfirmDialogContentProps = {
  onClose: () => void;
  project: Project;
  ref: Ref<DeleteConfirmDialogContentHandle>;
};

function DeleteConfirmDialogContent({ onClose, project, ref }: DeleteConfirmDialogContentProps) {
  async function deleteAction() {
    try {
      await db.projects.delete(project.id);
    } catch (error) {
      return String(error);
    }
    onClose();
  }

  const [error, action, isPending] = useActionState(deleteAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

  return (
    <>
      <DialogContent>
        <Stack spacing={1}>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{project.title}&rdquo;? This action cannot be
            undone.
          </DialogContentText>
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <MuiButton disabled={isPending} onClick={onClose}>
          Cancel
        </MuiButton>
        <MuiButton
          color="error"
          variant="contained"
          loading={isPending}
          onClick={() => {
            startTransition(action);
          }}
        >
          Delete
        </MuiButton>
      </DialogActions>
    </>
  );
}

type DeleteConfirmDialogProps = Pick<DeleteConfirmDialogContentProps, 'onClose' | 'project'> & {
  open: boolean;
};

function DeleteConfirmDialog({ open, onClose, project }: DeleteConfirmDialogProps) {
  const dialogContentRef = useRef<DeleteConfirmDialogContentHandle>(null);

  return (
    <Dialog
      maxWidth="xs"
      open={open}
      onClose={() => {
        if (dialogContentRef.current?.getIsPending()) {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle>Delete project</DialogTitle>
      <DeleteConfirmDialogContent ref={dialogContentRef} onClose={onClose} project={project} />
    </Dialog>
  );
}

type ProjectCardProps = {
  project: Project;
};

function ProjectCard({ project }: ProjectCardProps) {
  const { title, createdAt } = project;

  function preventRipple(event: SyntheticEvent) {
    event.stopPropagation();
  }

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  function handleCloseEditDialog() {
    setEditDialogOpen(false);
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
  }

  return (
    // TODO: Consider removing `modal={false}` after migrating to shadcn.
    // Currently needed to avoid scroll lock conflict between Base UI and
    // MUI's separate scroll managers.
    <>
      <DropdownMenu modal={false}>
        <Card sx={{ height: '100%' }}>
          <CardActionArea
            component={Link}
            href={`/dashboard/project/${project.id}`}
            sx={{ height: '100%' }}
          >
            <Stack sx={{ height: '100%' }}>
              <CardHeader
                action={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        aria-label="Project menu"
                        onMouseDown={preventRipple}
                        onTouchStart={preventRipple}
                        onClick={(event) => {
                          // Prevent navigation
                          event.preventDefault();
                        }}
                      >
                        <Ellipsis />
                      </Button>
                    }
                  />
                }
                title={title}
                subheader={`Created ${dateFormatter.format(new Date(createdAt))}`}
              />
              <CardContent sx={{ flex: 1 }}>{/* TODO */}</CardContent>
            </Stack>
          </CardActionArea>
        </Card>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              setEditDialogOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProjectDialog
        action={(estimatedDataVolume, collectionPeriod, subreddits, aiMlModelPlan, formData) =>
          updateProject(
            project,
            estimatedDataVolume,
            collectionPeriod,
            subreddits,
            aiMlModelPlan,
            formData,
          )
        }
        initialProject={project}
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        submitLabel="Save changes"
        title="Edit project"
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        project={project}
        onClose={handleCloseDeleteDialog}
      />
    </>
  );
}

export function ProjectCards() {
  const projects = useProjects();

  return projects.map((project) => (
    <GridItem key={project.id}>
      <ProjectCard project={project} />
    </GridItem>
  ));
}
