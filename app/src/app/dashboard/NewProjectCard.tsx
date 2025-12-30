'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import { ProjectDialog } from './ProjectDialog';
import { createProject } from '#app/actions/project.ts';

export function NewProjectCard() {
  const [open, setOpen] = useState(false);

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
            <span className="text-xl font-medium">New project</span>
          </CardContent>
        </CardActionArea>
      </Card>
      <ProjectDialog
        action={(estimatedDataVolume, collectionPeriod, subreddits, aiMlModelPlan, formData) =>
          createProject(estimatedDataVolume, collectionPeriod, subreddits, aiMlModelPlan, formData)
        }
        infoMessage="This information initialises your DPIA and will flow through all PETLP phases."
        open={open}
        onClose={handleClose}
        submitLabel="Create project"
        title="Create new research project"
      />
    </>
  );
}
