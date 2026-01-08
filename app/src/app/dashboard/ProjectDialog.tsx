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
import { CircleAlert, Info } from 'lucide-react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Alert, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#app/components/ui/dialog.tsx';
import {
  AI_ML_MODEL_PLAN_OPTIONS,
  collectionPeriodSchema,
  estimatedDataVolumeSchema,
  RESEARCH_OBJECTIVE_MAX_LENGTH,
  type AiMlModelPlan,
  type CollectionPeriod,
  type EstimatedDataVolume,
  type ProjectFormState,
  type ProjectInput,
} from '../actions/project';

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

const AI_ML_MODEL_PLAN_LABELS: Record<AiMlModelPlan, string> = {
  none: 'No AI/ML models',
  classification: 'Classification models',
  nlp: 'NLP/Text analysis',
  llm: 'Large language models',
  customDeepLearning: 'Custom deep learning',
};

function normaliseSubreddit(value: string): string {
  // Remove `r/` prefix and trim whitespace.
  return value.replace(/^r\//, '').trim();
}

type InitialProject = Omit<
  ProjectInput,
  'estimatedDataVolume' | 'collectionPeriod' | 'aiMlModelPlan'
> & {
  estimatedDataVolume: EstimatedDataVolume | null;
  collectionPeriod: CollectionPeriod | null;
  aiMlModelPlan: AiMlModelPlan | null;
};

const EMPTY_PROJECT: InitialProject = {
  title: '',
  researchObjective: '',
  estimatedDataVolume: null,
  collectionPeriod: null,
  subreddits: [],
  aiMlModelPlan: null,
  principalInvestigator: '',
  institution: '',
};

type ProjectDialogContentHandle = { getIsPending: () => boolean };

type ProjectDialogContentProps = {
  action: (
    estimatedDataVolume: EstimatedDataVolume | null,
    collectionPeriod: CollectionPeriod | null,
    subreddits: string[],
    aiMlModelPlan: AiMlModelPlan | null,
    formData: FormData,
  ) => Promise<ProjectFormState | undefined>;
  initialProject?: InitialProject;
  infoMessage?: string;
  onClose: () => void;
  ref: Ref<ProjectDialogContentHandle>;
  submitLabel: string;
};

function ProjectDialogContent({
  action: actionProp,
  initialProject = EMPTY_PROJECT,
  infoMessage,
  onClose,
  ref,
  submitLabel,
}: ProjectDialogContentProps) {
  const formId = useId();
  const dataVolumeLabelId = useId();
  const collectionPeriodLabelId = useId();
  const aiMlModelPlanLabelId = useId();
  const [researchObjectiveLength, setResearchObjectiveLength] = useState(
    initialProject.researchObjective.length,
  );
  const [subreddits, setSubreddits] = useState(initialProject.subreddits);
  const [estimatedDataVolume, setEstimatedDataVolume] = useState(
    initialProject.estimatedDataVolume,
  );
  const [collectionPeriod, setCollectionPeriod] = useState(initialProject.collectionPeriod);
  const [aiMlModelPlan, setAiMlModelPlan] = useState(initialProject.aiMlModelPlan);

  async function submitAction(_prevState: ProjectFormState | undefined, formData: FormData) {
    const result = await actionProp(
      estimatedDataVolume,
      collectionPeriod,
      subreddits,
      aiMlModelPlan,
      formData,
    );
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
      <DialogBody>
        <div className="flex flex-col gap-2">
          {infoMessage && (
            <Alert>
              <Info />
              <AlertTitle>{infoMessage}</AlertTitle>
            </Alert>
          )}
          {state?.errors.formErrors.map((error) => (
            <Alert key={error} variant="destructive">
              <CircleAlert />
              <AlertTitle>{error}</AlertTitle>
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
              required
              name={'title' satisfies keyof ProjectInput}
              defaultValue={initialProject.title}
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
              name={'researchObjective' satisfies keyof ProjectInput}
              defaultValue={initialProject.researchObjective}
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
            <div className="flex gap-4">
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
            </div>
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
            <FormControl
              required
              error={!!state?.errors.fieldErrors.aiMlModelPlan?.length}
              margin="dense"
              size="small"
              fullWidth
            >
              <InputLabel id={aiMlModelPlanLabelId}>AI/ML model plans</InputLabel>
              <Select
                labelId={aiMlModelPlanLabelId}
                label="AI/ML model plans"
                value={aiMlModelPlan ?? ''}
                onChange={(event) => {
                  setAiMlModelPlan(event.target.value);
                }}
              >
                {AI_ML_MODEL_PLAN_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {AI_ML_MODEL_PLAN_LABELS[option]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {state?.errors.fieldErrors.aiMlModelPlan?.[0] ??
                  'This helps determine privacy safeguards needed'}
              </FormHelperText>
            </FormControl>
            <div className="flex gap-4">
              <TextField
                required
                name={'principalInvestigator' satisfies keyof ProjectInput}
                defaultValue={initialProject.principalInvestigator}
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
                name={'institution' satisfies keyof ProjectInput}
                defaultValue={initialProject.institution}
                label="Institution"
                placeholder="University or organisation"
                error={!!state?.errors.fieldErrors.institution?.length}
                helperText={state?.errors.fieldErrors.institution?.[0]}
                margin="dense"
                size="small"
                fullWidth
              />
            </div>
          </form>
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose disabled={isPending} render={<Button variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={formId} loading={isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

type ProjectDialogProps = Omit<ProjectDialogContentProps, 'ref'> & {
  open: boolean;
  title: string;
};

export function ProjectDialog({
  action,
  initialProject,
  infoMessage,
  onClose,
  open,
  submitLabel,
  title,
}: ProjectDialogProps) {
  const dialogContentRef = useRef<ProjectDialogContentHandle>(null);

  return (
    <Dialog
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
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ProjectDialogContent
          ref={dialogContentRef}
          action={action}
          initialProject={initialProject}
          infoMessage={infoMessage}
          onClose={onClose}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
