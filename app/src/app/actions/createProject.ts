import * as z from 'zod';

export const RESEARCH_OBJECTIVE_MAX_LENGTH = 500;

const createProjectSchema = z.object({
  title: z.string().trim().min(1),
  researchObjective: z.string().trim().min(1).max(RESEARCH_OBJECTIVE_MAX_LENGTH),
  subreddits: z.array(z.string().trim().min(1)).min(1),
  principalInvestigator: z.string().trim().min(1),
  institution: z.string().trim().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type Project = CreateProjectInput & {
  id: string;
  /** ISO date string (YYYY-MM-DD) */
  createdAt: string;
};

export type CreateProjectState = {
  errors: z.core.$ZodFlattenedError<CreateProjectInput>;
  formData: FormData;
};

export function createProject(
  subreddits: string[],
  onCreate: (project: Project) => void,
  formData: FormData,
): CreateProjectState | undefined {
  const rawFormData = {
    ...Object.fromEntries(formData),
    subreddits,
  };
  const parsedResult = createProjectSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
      formData,
    };
  }

  const project: Project = {
    ...parsedResult.data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString().slice(0, 10),
  };

  onCreate(project);
}
