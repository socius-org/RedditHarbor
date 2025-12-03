import * as z from 'zod';

const createProjectSchema = z.object({
  title: z.string().trim().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type CreateProjectState = {
  errors: z.core.$ZodFlattenedError<CreateProjectInput>;
  formData: FormData;
};

export function createProject(formData: FormData): CreateProjectState | undefined {
  const rawFormData = Object.fromEntries(formData);
  const parsedResult = createProjectSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
      formData,
    };
  }

  // TODO: Implement actual project creation
  console.log('Creating project:', parsedResult.data);
}
