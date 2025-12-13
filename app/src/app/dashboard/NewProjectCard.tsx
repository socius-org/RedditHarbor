'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { ProjectDialog } from './ProjectDialog';
import { useProjects } from './useProjects';
import { createProject } from '#app/actions/createProject.ts';

export function NewProjectCard() {
  const [open, setOpen] = useState(false);

  const [, { addProject }] = useProjects();

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <Card
        sx={{
          border: '2px dashed',
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <CardActionArea
          sx={{ height: '100%' }}
          onClick={() => {
            setOpen(true);
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <AddIcon fontSize="large" />
            </Box>
            <Typography variant="h6">New project</Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <ProjectDialog
        action={(subreddits, formData) => createProject(subreddits, addProject, formData)}
        infoMessage="This information initialises your DPIA and will flow through all PETLP phases."
        open={open}
        onClose={handleClose}
        submitLabel="Create project"
        title="Create new research project"
      />
    </>
  );
}
