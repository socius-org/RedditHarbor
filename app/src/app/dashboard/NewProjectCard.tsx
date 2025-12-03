'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

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
            <Typography variant="h6">New project</Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <Dialog fullWidth open={open} onClose={handleClose}>
        <DialogTitle>Create new research project</DialogTitle>
        <DialogContent>
          <DialogContentText>TODO</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Create project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
