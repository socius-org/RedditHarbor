import * as z from 'zod';

export const RESEARCH_OBJECTIVE_MAX_LENGTH = 500;

export const estimatedDataVolumeSchema = z.union([
  z.tuple([z.null(), z.number()]),
  z.tuple([z.number(), z.number()]),
  z.tuple([z.number(), z.null()]),
]);

export const collectionPeriodSchema = z.object({
  months: z.number().int().positive().nullable(),
});

export const AI_ML_MODEL_PLAN_OPTIONS = [
  'none',
  'classification',
  'nlp',
  'llm',
  'customDeepLearning',
] as const;

export const aiMlModelPlanSchema = z.enum(AI_ML_MODEL_PLAN_OPTIONS);

export type EstimatedDataVolume = z.infer<typeof estimatedDataVolumeSchema>;
export type CollectionPeriod = z.infer<typeof collectionPeriodSchema>;
export type AiMlModelPlan = z.infer<typeof aiMlModelPlanSchema>;

export const projectSchema = z.object({
  id: z.uuidv4(),
  title: z.string().trim().min(1),
  researchObjective: z.string().trim().min(1).max(RESEARCH_OBJECTIVE_MAX_LENGTH),
  estimatedDataVolume: estimatedDataVolumeSchema,
  collectionPeriod: collectionPeriodSchema,
  subreddits: z.array(z.string().trim().min(1)).min(1),
  aiMlModelPlan: aiMlModelPlanSchema,
  principalInvestigator: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  createdAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;

const projectInputSchema = projectSchema.omit({ id: true, createdAt: true });

export type ProjectInput = z.infer<typeof projectInputSchema>;

export type ProjectFormState = {
  errors: z.core.$ZodFlattenedError<ProjectInput>;
};

export function createProject(
  estimatedDataVolume: EstimatedDataVolume | null,
  collectionPeriod: CollectionPeriod | null,
  subreddits: string[],
  aiMlModelPlan: AiMlModelPlan | null,
  onCreate: (project: Project) => void,
  formData: FormData,
): ProjectFormState | undefined {
  const rawFormData = {
    ...Object.fromEntries(formData),
    estimatedDataVolume,
    collectionPeriod,
    subreddits,
    aiMlModelPlan,
  };
  const parsedResult = projectInputSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
    };
  }

  const project: Project = {
    ...parsedResult.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  onCreate(project);
}

export function updateProject(
  existingProject: Project,
  estimatedDataVolume: EstimatedDataVolume | null,
  collectionPeriod: CollectionPeriod | null,
  subreddits: string[],
  aiMlModelPlan: AiMlModelPlan | null,
  onUpdate: (project: Project) => void,
  formData: FormData,
): ProjectFormState | undefined {
  const rawFormData = {
    ...Object.fromEntries(formData),
    estimatedDataVolume,
    collectionPeriod,
    subreddits,
    aiMlModelPlan,
  };
  const parsedResult = projectInputSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
    };
  }

  const project: Project = {
    ...parsedResult.data,
    id: existingProject.id,
    createdAt: existingProject.createdAt,
  };

  onUpdate(project);
}
