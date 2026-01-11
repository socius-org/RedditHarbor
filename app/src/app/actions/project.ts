import * as z from 'zod';
import { db } from '../database';

export const RESEARCH_OBJECTIVE_MAX_LENGTH = 500;

const estimatedDataVolumeSchema = z.union([
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

const projectSchema = z.object({
  id: z.uuidv4(),
  title: z.string().trim().min(1),
  researchObjective: z.string().trim().min(1).max(RESEARCH_OBJECTIVE_MAX_LENGTH),
  estimatedDataVolume: z
    .string()
    .min(1, 'Required')
    .pipe(
      z.preprocess((input, context): unknown => {
        try {
          return JSON.parse(input);
        } catch {
          context.issues.push({ code: 'custom', message: 'Invalid JSON', input });
          return z.NEVER;
        }
      }, estimatedDataVolumeSchema),
    ),
  collectionPeriod: collectionPeriodSchema,
  subreddits: z.array(z.string().trim().min(1)).min(1),
  aiMlModelPlan: aiMlModelPlanSchema,
  principalInvestigator: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;

const projectInputSchema = projectSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type ProjectInput = z.infer<typeof projectInputSchema>;

export type ProjectFormState = {
  errors: z.core.$ZodFlattenedError<ProjectInput>;
};

export async function createProject(
  collectionPeriod: CollectionPeriod | null,
  subreddits: string[],
  formData: FormData,
): Promise<ProjectFormState | undefined> {
  const rawFormData = {
    ...Object.fromEntries(formData),
    collectionPeriod,
    subreddits,
  };
  const parsedResult = projectInputSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
    };
  }

  const now = new Date().toISOString();
  const project: Project = {
    ...parsedResult.data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.projects.add(project);
  } catch (error) {
    return {
      errors: {
        formErrors: [String(error)],
        fieldErrors: {},
      },
    };
  }
}

export async function updateProject(
  existingProject: Project,
  collectionPeriod: CollectionPeriod | null,
  subreddits: string[],
  formData: FormData,
): Promise<ProjectFormState | undefined> {
  const rawFormData = {
    ...Object.fromEntries(formData),
    collectionPeriod,
    subreddits,
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
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.projects.put(project);
  } catch (error) {
    return {
      errors: {
        formErrors: [String(error)],
        fieldErrors: {},
      },
    };
  }
}
