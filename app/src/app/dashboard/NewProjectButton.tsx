'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '#app/components/ui/button.tsx';
import { createProject } from '#app/actions/project.ts';
import { ProjectDialog } from './ProjectDialog';

export function NewProjectButton() {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        <Plus />
        New project
      </Button>
      <ProjectDialog
        action={createProject}
        infoMessage="This information initialises your DPIA and will flow through all PETLP phases."
        open={open}
        onClose={handleClose}
        submitLabel="Create project"
        title="Create new research project"
      />
    </>
  );
}
