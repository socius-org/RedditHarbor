import {
  startTransition,
  useActionState,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import isEqual from 'react-fast-compare';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  createProject,
  type CreateProjectInput,
  type CreateProjectState,
  RESEARCH_OBJECTIVE_MAX_LENGTH,
} from '../actions/createProject';
import { useProjects } from './useProjects';

function stripSubredditPrefix(value: string): string {
  return value.replace(/^r\//, '');
}

type ProjectDialogContentHandle = { getIsPending: () => boolean };

type ProjectDialogContentProps = {
  infoMessage?: string;
  onClose: () => void;
  ref: Ref<ProjectDialogContentHandle>;
  submitLabel: string;
};

function ProjectDialogContent({
  infoMessage,
  onClose,
  ref,
  submitLabel,
}: ProjectDialogContentProps) {
  const [, { addProject }] = useProjects();
  const formId = useId();
  const [researchObjectiveLength, setResearchObjectiveLength] = useState(0);
  const [subreddits, setSubreddits] = useState<string[]>([]);

  function submitAction(_prevState: CreateProjectState | undefined, formData: FormData) {
    const result = createProject(subreddits, addProject, formData);
    if (!result?.errors) {
      onClose();
    }
    return result;
  }

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

  return (
    <>
      <DialogContent>
        <Stack spacing={1}>
          {infoMessage && (
            <Alert severity="info" variant="filled">
              {infoMessage}
            </Alert>
          )}
          {state?.errors.formErrors.map((error) => (
            <Alert key={error} severity="error" variant="filled">
              {error}
            </Alert>
          ))}
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(() => {
                action(formData);
              });
            }}
          >
            <TextField
              autoFocus
              required
              name={'title' satisfies keyof CreateProjectInput}
              label="Project title"
              placeholder="Political Discourse Analysis 2024"
              error={!!state?.errors.fieldErrors.title?.length}
              helperText={
                state?.errors.fieldErrors.title?.[0] ??
                'Choose a descriptive title for your Reddit research project'
              }
              margin="dense"
              size="small"
              fullWidth
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
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={subreddits}
              isOptionEqualToValue={(option, value) => stripSubredditPrefix(option) === value}
              onChange={(_, values) => {
                const next = values.map(stripSubredditPrefix).filter(Boolean);
                setSubreddits((prev) => (isEqual(prev, next) ? prev : next));
              }}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} {...itemProps} label={`r/${option}`} size="small" />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  // https://github.com/mui/material-ui/issues/21663#issuecomment-732298594
                  required
                  label="Target subreddits"
                  placeholder="politics"
                  error={!!state?.errors.fieldErrors.subreddits?.length}
                  helperText={
                    state?.errors.fieldErrors.subreddits?.[0] ?? (
                      <>
                        Add at least one (press <kbd>Enter</kbd> to add). You can refine this list
                        during the Extract phase.
                      </>
                    )
                  }
                  slotProps={{
                    htmlInput: { ...params.inputProps, required: subreddits.length === 0 },
                  }}
                  margin="dense"
                  size="small"
                />
              )}
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
          {submitLabel}
        </Button>
      </DialogActions>
    </>
  );
}

type ProjectDialogProps = Omit<ProjectDialogContentProps, 'ref'> & {
  open: boolean;
  title: string;
};

export function ProjectDialog({
  infoMessage,
  onClose,
  open,
  submitLabel,
  title,
}: ProjectDialogProps) {
  const dialogContentRef = useRef<ProjectDialogContentHandle>(null);

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={() => {
        if (dialogContentRef.current?.getIsPending()) {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <ProjectDialogContent
        ref={dialogContentRef}
        infoMessage={infoMessage}
        onClose={onClose}
        submitLabel={submitLabel}
      />
    </Dialog>
  );
}
