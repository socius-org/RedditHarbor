import * as z from 'zod';
import { projectSchema, type Project } from '../actions/createProject';
import { useLocalStorageState } from '../utils/useLocalStorageState';

function parseProjects(value: string | null): Project[] {
  if (!value) return [];

  const parsed = z.array(projectSchema).safeParse(JSON.parse(value));
  if (parsed.success) {
    return parsed.data;
  }
  // Silently drop invalid data
  return [];
}

export function useProjects() {
  // TODO: localStorage is temporary. Move to IndexedDB once the data model stabilises.
  const [stored, setStored] = useLocalStorageState('projects');

  function addProject(project: Project) {
    setStored((prev) => JSON.stringify([...parseProjects(prev), project]));
  }

  return [parseProjects(stored), addProject] as const;
}
