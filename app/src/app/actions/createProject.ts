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

export type EstimatedDataVolume = z.infer<typeof estimatedDataVolumeSchema>;
export type CollectionPeriod = z.infer<typeof collectionPeriodSchema>;

export const projectSchema = z.object({
  id: z.uuidv4(),
  title: z.string().trim().min(1),
  researchObjective: z.string().trim().min(1).max(RESEARCH_OBJECTIVE_MAX_LENGTH),
  estimatedDataVolume: estimatedDataVolumeSchema,
  collectionPeriod: collectionPeriodSchema,
  subreddits: z.array(z.string().trim().min(1)).min(1),
  principalInvestigator: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  createdAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;

const createProjectSchema = projectSchema.omit({ id: true, createdAt: true });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type CreateProjectState = {
  errors: z.core.$ZodFlattenedError<CreateProjectInput>;
};

export function createProject(
  estimatedDataVolume: EstimatedDataVolume | null,
  collectionPeriod: CollectionPeriod | null,
  subreddits: string[],
  onCreate: (project: Project) => void,
  formData: FormData,
): CreateProjectState | undefined {
  const rawFormData = {
    ...Object.fromEntries(formData),
    estimatedDataVolume,
    collectionPeriod,
    subreddits,
  };
  const parsedResult = createProjectSchema.safeParse(rawFormData);

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
