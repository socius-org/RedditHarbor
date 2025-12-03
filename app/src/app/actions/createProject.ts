import * as z from 'zod';

export const RESEARCH_OBJECTIVE_MAX_LENGTH = 500;

export const projectSchema = z.object({
  id: z.uuidv4(),
  title: z.string().trim().min(1),
  researchObjective: z.string().trim().min(1).max(RESEARCH_OBJECTIVE_MAX_LENGTH),
  subreddits: z.array(z.string().trim().min(1)).min(1),
  principalInvestigator: z.string().trim().min(1),
  institution: z.string().trim().min(1),
  createdAt: z.iso.date(),
});

export type Project = z.infer<typeof projectSchema>;

const createProjectSchema = projectSchema.omit({ id: true, createdAt: true });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

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
