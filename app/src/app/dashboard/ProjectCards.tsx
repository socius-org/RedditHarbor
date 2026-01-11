'use client';

import {
  startTransition,
  useActionState,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import Link from 'next/link';
import { CircleAlert, Ellipsis } from 'lucide-react';
import { Alert, AlertTitle } from '#app/components/ui/alert.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#app/components/ui/alert-dialog.tsx';
import { Button } from '#app/components/ui/button.tsx';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#app/components/ui/card.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx';
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
      <AlertDialogHeader>
        <AlertDialogTitle>Delete project</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete &ldquo;{project.title}&rdquo;? This action cannot be
          undone.
        </AlertDialogDescription>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          loading={isPending}
          variant="destructive"
          onClick={() => {
            startTransition(action);
          }}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

type DeleteConfirmDialogProps = Pick<DeleteConfirmDialogContentProps, 'onClose' | 'project'> & {
  open: boolean;
};

function DeleteConfirmDialog({ open, onClose, project }: DeleteConfirmDialogProps) {
  const dialogContentRef = useRef<DeleteConfirmDialogContentHandle>(null);

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            if (dialogContentRef.current?.getIsPending()) {
              return;
            }
            onClose();
          }
        }}
      >
        <AlertDialogContent>
          <DeleteConfirmDialogContent ref={dialogContentRef} onClose={onClose} project={project} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type ProjectCardProps = {
  project: Project;
};

function ProjectCard({ project }: ProjectCardProps) {
  const { title, createdAt } = project;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  function handleCloseEditDialog() {
    setEditDialogOpen(false);
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <Card
          render={<Link href={`/dashboard/project/${project.id}`} />}
          className="h-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:ring-3 hover:ring-ring/50"
        >
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Created {dateFormatter.format(new Date(createdAt))}</CardDescription>
            <CardAction>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Project menu"
                    onClick={(event) => {
                      // Prevent navigation
                      event.preventDefault();
                    }}
                  >
                    <Ellipsis />
                  </Button>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent>{/* TODO */}</CardContent>
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
        action={(subreddits, formData) => updateProject(project, subreddits, formData)}
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
