import { useSuspendingLiveQuery } from 'dexie-react-hooks';
import { db } from '../database';
import type { Project } from '../actions/project';

export function useProjects() {
  const projects = useSuspendingLiveQuery(
    async () =>
      (await db.projects.toArray()).toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    ['projects'],
  );

  function deleteProject(project: Project) {
    return db.projects.delete(project.id);
  }

  return [projects, { deleteProject }] as const;
}
