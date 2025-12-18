import { useSuspendingLiveQuery } from 'dexie-react-hooks';
import { db } from '../database';
import type { Project } from '../actions/project';

export function useProjects() {
  const projects = useSuspendingLiveQuery(() => db.projects.toArray(), ['projects']);

  function addProject(project: Project) {
    return db.projects.add(project);
  }

  function updateProject(project: Project) {
    return db.projects.put(project);
  }

  function deleteProject(project: Project) {
    return db.projects.delete(project.id);
  }

  return [projects, { addProject, updateProject, deleteProject }] as const;
}
