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
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  collectionPeriodSchema,
  estimatedDataVolumeSchema,
  RESEARCH_OBJECTIVE_MAX_LENGTH,
  type CollectionPeriod,
  type CreateProjectInput,
  type CreateProjectState,
  type EstimatedDataVolume,
} from '../actions/createProject';

const ESTIMATED_DATA_VOLUME_OPTIONS: EstimatedDataVolume[] = [
  [null, 10_000],
  [10_000, 100_000],
  [100_000, 1_000_000],
  [1_000_000, null],
];

const dataVolumeNumberFormat = new Intl.NumberFormat('en-GB', {
  notation: 'compact',
});

function formatDataVolume(volume: EstimatedDataVolume): string {
  const [min, max] = volume;
  if (min === null) return `< ${dataVolumeNumberFormat.format(max)}`;
  if (max === null) return `> ${dataVolumeNumberFormat.format(min)}`;
  return dataVolumeNumberFormat.formatRange(min, max);
}

const COLLECTION_PERIOD_OPTIONS: CollectionPeriod[] = [
  { months: 1 },
  { months: 3 },
  { months: 6 },
  { months: 12 },
  { months: null },
];

const collectionPeriodDurationFormat = new Intl.DurationFormat('en-GB', { style: 'long' });

function formatCollectionPeriod({ months }: CollectionPeriod): string {
  const formatted = collectionPeriodDurationFormat.format(
    months === 12 || months === null ? { years: 1 } : { months },
  );
  if (months === null) {
    return `Historical (> ${formatted})`;
  }
  return formatted;
}

function normaliseSubreddit(value: string): string {
  // Remove `r/` prefix and trim whitespace.
  return value.replace(/^r\//, '').trim();
}

type ProjectDialogContentHandle = { getIsPending: () => boolean };

type ProjectDialogContentProps = {
  // TODO: ideally this generic component should no longer reference `CreateProjectState`,
  // but we can revisit this once we implement edit flow.
  action: (
    estimatedDataVolume: EstimatedDataVolume | null,
    collectionPeriod: CollectionPeriod | null,
    subreddits: string[],
    formData: FormData,
  ) => CreateProjectState | undefined;
  infoMessage?: string;
  onClose: () => void;
  ref: Ref<ProjectDialogContentHandle>;
  submitLabel: string;
};

function ProjectDialogContent({
  action: actionProp,
  infoMessage,
  onClose,
  ref,
  submitLabel,
}: ProjectDialogContentProps) {
  const formId = useId();
  const dataVolumeLabelId = useId();
  const collectionPeriodLabelId = useId();
  const [researchObjectiveLength, setResearchObjectiveLength] = useState(0);
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [estimatedDataVolume, setEstimatedDataVolume] = useState<EstimatedDataVolume | null>(null);
  const [collectionPeriod, setCollectionPeriod] = useState<CollectionPeriod | null>(null);

  function submitAction(_prevState: CreateProjectState | undefined, formData: FormData) {
    const result = actionProp(estimatedDataVolume, collectionPeriod, subreddits, formData);
    if (!result?.errors) {
      onClose();
    }
    return result;
  }

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

  const matchingEstimatedDataVolume = ESTIMATED_DATA_VOLUME_OPTIONS.find((option) =>
    isEqual(option, estimatedDataVolume),
  );
  const matchingCollectionPeriod = COLLECTION_PERIOD_OPTIONS.find((option) =>
    isEqual(option, collectionPeriod),
  );

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
            <Stack direction="row" spacing={2}>
              <FormControl
                required
                error={!!state?.errors.fieldErrors.estimatedDataVolume?.length}
                margin="dense"
                size="small"
                fullWidth
              >
                <InputLabel id={dataVolumeLabelId}>Estimated data volume</InputLabel>
                <Select
                  labelId={dataVolumeLabelId}
                  label="Estimated data volume"
                  value={
                    matchingEstimatedDataVolume ? JSON.stringify(matchingEstimatedDataVolume) : ''
                  }
                  onChange={(event) => {
                    setEstimatedDataVolume(
                      estimatedDataVolumeSchema.safeParse(JSON.parse(event.target.value)).data ??
                        null,
                    );
                  }}
                >
                  {ESTIMATED_DATA_VOLUME_OPTIONS.map((option) => {
                    const stringified = JSON.stringify(option);
                    return (
                      <MenuItem key={stringified} value={stringified}>
                        {formatDataVolume(option)} posts
                      </MenuItem>
                    );
                  })}
                </Select>
                {state?.errors.fieldErrors.estimatedDataVolume?.[0] ? (
                  <FormHelperText>{state.errors.fieldErrors.estimatedDataVolume[0]}</FormHelperText>
                ) : null}
              </FormControl>
              <FormControl
                required
                error={!!state?.errors.fieldErrors.collectionPeriod?.length}
                margin="dense"
                size="small"
                fullWidth
              >
                <InputLabel id={collectionPeriodLabelId}>Collection period</InputLabel>
                <Select
                  labelId={collectionPeriodLabelId}
                  label="Collection period"
                  value={matchingCollectionPeriod ? JSON.stringify(matchingCollectionPeriod) : ''}
                  onChange={(event) => {
                    setCollectionPeriod(
                      collectionPeriodSchema.safeParse(JSON.parse(event.target.value)).data ?? null,
                    );
                  }}
                >
                  {COLLECTION_PERIOD_OPTIONS.map((option) => {
                    const stringified = JSON.stringify(option);
                    return (
                      <MenuItem key={stringified} value={stringified}>
                        {formatCollectionPeriod(option)}
                      </MenuItem>
                    );
                  })}
                </Select>
                {state?.errors.fieldErrors.collectionPeriod?.[0] ? (
                  <FormHelperText>{state.errors.fieldErrors.collectionPeriod[0]}</FormHelperText>
                ) : null}
              </FormControl>
            </Stack>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={subreddits}
              isOptionEqualToValue={(option, value) => normaliseSubreddit(option) === value}
              onChange={(_, values) => {
                const next = values.map(normaliseSubreddit).filter(Boolean);
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
  action,
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
        action={action}
        infoMessage={infoMessage}
        onClose={onClose}
        submitLabel={submitLabel}
      />
    </Dialog>
  );
}
