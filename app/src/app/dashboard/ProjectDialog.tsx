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
import TextField from '@mui/material/TextField';
import { Alert, AlertTitle } from '#app/components/ui/alert.tsx';
import { Button } from '#app/components/ui/button.tsx';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '#app/components/ui/combobox.tsx';
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#app/components/ui/field.tsx';
import { Input } from '#app/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectFieldLabel,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#app/components/ui/select.tsx';
import { Textarea } from '#app/components/ui/textarea.tsx';
import {
  AI_ML_MODEL_PLAN_OPTIONS,
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

const AI_ML_MODEL_PLAN_ITEMS: { label: string; value: AiMlModelPlan | null }[] = [
  { label: 'Select AI/ML model plan', value: null },
  ...AI_ML_MODEL_PLAN_OPTIONS.map((option) => ({
    label: AI_ML_MODEL_PLAN_LABELS[option],
    value: option,
  })),
];

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

function SubredditCombobox({ defaultValue }: { defaultValue: string[] }) {
  const subredditsContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <Combobox key={defaultValue.join(',')} autoHighlight defaultValue={defaultValue} multiple>
      <ComboboxChips ref={subredditsContainerRef}>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={values.length > 0 ? '' : 'e.g. politics'} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={subredditsContainerRef}>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

type ProjectDialogContentHandle = { getIsPending: () => boolean };

type ProjectDialogContentProps = {
  action: (subreddits: string[], formData: FormData) => Promise<ProjectFormState | undefined>;
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
  const [researchObjectiveLength, setResearchObjectiveLength] = useState(
    initialProject.researchObjective.length,
  );
  const [subreddits, setSubreddits] = useState(initialProject.subreddits);

  async function submitAction(_prevState: ProjectFormState | undefined, formData: FormData) {
    const result = await actionProp(subreddits, formData);
    if (!result?.errors) {
      onClose();
    }
    return result;
  }

  const [state, action, isPending] = useActionState(submitAction, undefined);

  useImperativeHandle(ref, () => ({ getIsPending: () => isPending }), [isPending]);

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
            <FieldGroup>
              <Field required invalid={!!state?.errors.fieldErrors.title?.length}>
                <FieldLabel>Project title</FieldLabel>
                <Input
                  name={'title' satisfies keyof ProjectInput}
                  defaultValue={initialProject.title}
                  placeholder="Political Discourse Analysis 2024"
                />
                {state?.errors.fieldErrors.title?.length ? (
                  <FieldError
                    errors={state.errors.fieldErrors.title.map((message) => ({
                      message,
                    }))}
                  />
                ) : (
                  <FieldDescription>
                    Choose a descriptive title for your Reddit research project
                  </FieldDescription>
                )}
              </Field>
              <Field required invalid={!!state?.errors.fieldErrors.researchObjective?.length}>
                <FieldLabel>Research objective</FieldLabel>
                <Textarea
                  name={'researchObjective' satisfies keyof ProjectInput}
                  defaultValue={initialProject.researchObjective}
                  placeholder="Describe the main research question or hypothesis you want to investigate..."
                  maxLength={RESEARCH_OBJECTIVE_MAX_LENGTH}
                  rows={3}
                  onChange={(event) => {
                    setResearchObjectiveLength(event.currentTarget.value.length);
                  }}
                />
                {state?.errors.fieldErrors.researchObjective?.length ? (
                  <FieldError
                    className="flex justify-between"
                    errors={state.errors.fieldErrors.researchObjective.map((message) => ({
                      message,
                    }))}
                    render={(props) => (
                      <div {...props}>
                        {props.children}
                        <span>
                          {researchObjectiveLength} / {RESEARCH_OBJECTIVE_MAX_LENGTH}
                        </span>
                      </div>
                    )}
                  />
                ) : (
                  <FieldDescription className="flex justify-between">
                    What do you aim to discover or understand through this research?
                    <span>
                      {researchObjectiveLength} / {RESEARCH_OBJECTIVE_MAX_LENGTH}
                    </span>
                  </FieldDescription>
                )}
              </Field>
              <div className="flex gap-4">
                <Field required invalid={!!state?.errors.fieldErrors.estimatedDataVolume?.length}>
                  <SelectFieldLabel>Estimated data volume</SelectFieldLabel>
                  <Select<EstimatedDataVolume>
                    key={JSON.stringify(initialProject.estimatedDataVolume)}
                    name={'estimatedDataVolume' satisfies keyof ProjectInput}
                    defaultValue={initialProject.estimatedDataVolume}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(value: EstimatedDataVolume | null) =>
                          value === null ? 'Select range' : `${formatDataVolume(value)} posts`
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ESTIMATED_DATA_VOLUME_OPTIONS.map((option) => (
                          <SelectItem key={JSON.stringify(option)} value={option}>
                            {formatDataVolume(option)} posts
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={state?.errors.fieldErrors.estimatedDataVolume?.map((message) => ({
                      message,
                    }))}
                  />
                </Field>
                <Field required invalid={!!state?.errors.fieldErrors.collectionPeriod?.length}>
                  <SelectFieldLabel>Collection period</SelectFieldLabel>
                  <Select
                    key={JSON.stringify(initialProject.collectionPeriod)}
                    name={'collectionPeriod' satisfies keyof ProjectInput}
                    defaultValue={initialProject.collectionPeriod}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(value: CollectionPeriod | null) =>
                          value === null ? 'Select duration' : formatCollectionPeriod(value)
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {COLLECTION_PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={JSON.stringify(option)} value={option}>
                            {formatCollectionPeriod(option)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={state?.errors.fieldErrors.collectionPeriod?.map((message) => ({
                      message,
                    }))}
                  />
                </Field>
              </div>
              <Field
                invalid={!!state?.errors.fieldErrors.subreddits?.length}
                name={'subreddits' satisfies keyof ProjectInput}
                required
              >
                <SelectFieldLabel>Target subreddits</SelectFieldLabel>
                <SubredditCombobox defaultValue={initialProject.subreddits} />
                {state?.errors.fieldErrors.subreddits?.length ? (
                  <FieldError
                    errors={state.errors.fieldErrors.subreddits.map((message) => ({
                      message,
                    }))}
                  />
                ) : (
                  <FieldDescription>Add at least one</FieldDescription>
                )}
              </Field>
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
                          Add at least one (press <kbd>Enter</kbd> to add)
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
              <Field required invalid={!!state?.errors.fieldErrors.aiMlModelPlan?.length}>
                <SelectFieldLabel>AI/ML model plans</SelectFieldLabel>
                <Select
                  key={initialProject.aiMlModelPlan}
                  name={'aiMlModelPlan' satisfies keyof ProjectInput}
                  defaultValue={initialProject.aiMlModelPlan}
                  items={AI_ML_MODEL_PLAN_ITEMS}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {AI_ML_MODEL_PLAN_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {AI_ML_MODEL_PLAN_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {state?.errors.fieldErrors.aiMlModelPlan?.length ? (
                  <FieldError
                    errors={state.errors.fieldErrors.aiMlModelPlan.map((message) => ({
                      message,
                    }))}
                  />
                ) : (
                  <FieldDescription>
                    This helps determine privacy safeguards needed
                  </FieldDescription>
                )}
              </Field>
              <div className="flex gap-4">
                <Field required invalid={!!state?.errors.fieldErrors.principalInvestigator?.length}>
                  <FieldLabel>Principal investigator</FieldLabel>
                  <Input
                    name={'principalInvestigator' satisfies keyof ProjectInput}
                    defaultValue={initialProject.principalInvestigator}
                    placeholder="Full name"
                  />
                  <FieldError
                    errors={state?.errors.fieldErrors.principalInvestigator?.map((message) => ({
                      message,
                    }))}
                  />
                </Field>
                <Field required invalid={!!state?.errors.fieldErrors.institution?.length}>
                  <FieldLabel>Institution</FieldLabel>
                  <Input
                    name={'institution' satisfies keyof ProjectInput}
                    defaultValue={initialProject.institution}
                    placeholder="University or organisation"
                  />
                  <FieldError
                    errors={state?.errors.fieldErrors.institution?.map((message) => ({
                      message,
                    }))}
                  />
                </Field>
              </div>
            </FieldGroup>
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
