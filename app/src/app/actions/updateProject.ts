import * as z from 'zod';
import { projectSchema, type CreateProjectState, type Project } from './createProject';

const updateProjectSchema = projectSchema.omit({ id: true, createdAt: true });

export function updateProject(
  existingProject: Project,
  subreddits: string[],
  onUpdate: (project: Project) => void,
  formData: FormData,
): CreateProjectState | undefined {
  const rawFormData = {
    ...Object.fromEntries(formData),
    subreddits,
  };
  const parsedResult = updateProjectSchema.safeParse(rawFormData);

  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
      formData,
    };
  }

  const project: Project = {
    ...parsedResult.data,
    id: existingProject.id,
    createdAt: existingProject.createdAt,
  };

  onUpdate(project);
}
