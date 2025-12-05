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

  function updateProject(project: Project) {
    setStored((prev) =>
      JSON.stringify(parseProjects(prev).map((p) => (p.id === project.id ? project : p))),
    );
  }

  function deleteProject(id: string) {
    setStored((prev) => JSON.stringify(parseProjects(prev).filter((p) => p.id !== id)));
  }

  return [parseProjects(stored), { addProject, updateProject, deleteProject }] as const;
}
