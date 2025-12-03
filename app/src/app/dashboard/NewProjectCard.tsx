'use client';

import { useActionState, useId, useImperativeHandle, useRef, useState, type Ref } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  createProject,
  type CreateProjectInput,
  type CreateProjectState,
  RESEARCH_OBJECTIVE_MAX_LENGTH,
} from '../actions/createProject';

type NewProjectDialogContentHandle = { getIsPending: () => boolean };

type NewProjectDialogContentProps = {
  onClose: () => void;
  ref: Ref<NewProjectDialogContentHandle>;
};

function NewProjectDialogContent({ onClose, ref }: NewProjectDialogContentProps) {
  const formId = useId();
  const [researchObjectiveLength, setResearchObjectiveLength] = useState(0);

  function submitAction(_prevState: CreateProjectState | undefined, formData: FormData) {
    const result = createProject(formData);
    if (!result?.errors) {
      onClose();
    }
    return result;
  }

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

  function getDefaultValue(key: keyof CreateProjectInput): string {
    const value = state?.formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  return (
    <>
      <DialogContent>
        <Stack spacing={1}>
          <Alert severity="info" variant="filled">
            This information initialises your DPIA and will flow through all PETLP phases. You can
            update these details later as your research evolves.
          </Alert>
          {state?.errors.formErrors.map((error) => (
            <Alert key={error} severity="error" variant="filled">
              {error}
            </Alert>
          ))}
          <form action={action} id={formId}>
            <TextField
              autoFocus
              required
              name={'title' satisfies keyof CreateProjectInput}
              label="Project title"
              placeholder="e.g., Political Discourse Analysis 2024"
              error={!!state?.errors.fieldErrors.title?.length}
              helperText={
                state?.errors.fieldErrors.title?.[0] ??
                'Choose a descriptive title for your Reddit research project'
              }
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('title')}
            />
            <TextField
              required
              multiline
              rows={3}
              name={'researchObjective' satisfies keyof CreateProjectInput}
              label="Research objective"
              placeholder="Describe the main research question or hypothesis you want to investigate..."
              error={!!state?.errors.fieldErrors.researchObjective?.length}
              helperText={
                <>
                  <span>
                    {state?.errors.fieldErrors.researchObjective?.[0] ??
                      'What do you aim to discover or understand through this research?'}
                  </span>
                  <span>
                    {researchObjectiveLength} / {RESEARCH_OBJECTIVE_MAX_LENGTH}
                  </span>
                </>
              }
              slotProps={{
                formHelperText: { sx: { display: 'flex', justifyContent: 'space-between' } },
                htmlInput: { maxLength: RESEARCH_OBJECTIVE_MAX_LENGTH },
              }}
              onChange={(event) => {
                setResearchObjectiveLength(event.currentTarget.value.length);
              }}
              margin="dense"
              size="small"
              fullWidth
              defaultValue={getDefaultValue('researchObjective')}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                required
                name={'principalInvestigator' satisfies keyof CreateProjectInput}
                label="Principal investigator"
                placeholder="Full name"
                error={!!state?.errors.fieldErrors.principalInvestigator?.length}
                helperText={state?.errors.fieldErrors.principalInvestigator?.[0]}
                margin="dense"
                size="small"
                fullWidth
                defaultValue={getDefaultValue('principalInvestigator')}
              />
              <TextField
                required
                name={'institution' satisfies keyof CreateProjectInput}
                label="Institution"
                placeholder="University or organisation"
                error={!!state?.errors.fieldErrors.institution?.length}
                helperText={state?.errors.fieldErrors.institution?.[0]}
                margin="dense"
                size="small"
                fullWidth
                defaultValue={getDefaultValue('institution')}
              />
            </Stack>
          </form>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={formId} variant="contained" loading={isPending}>
          Create project
        </Button>
      </DialogActions>
    </>
  );
}

export function NewProjectCard() {
  const [open, setOpen] = useState(false);
  const dialogContentRef = useRef<NewProjectDialogContentHandle>(null);

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
      <Dialog
        fullWidth
        open={open}
        onClose={() => {
          if (dialogContentRef.current?.getIsPending()) {
            return;
          }
          handleClose();
        }}
      >
        <DialogTitle>Create new research project</DialogTitle>
        <NewProjectDialogContent onClose={handleClose} ref={dialogContentRef} />
      </Dialog>
    </>
  );
}
