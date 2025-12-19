import { useSuspendingLiveQuery } from 'dexie-react-hooks';
import { db } from '../database';

export function useProjects() {
  return useSuspendingLiveQuery(
    async () =>
      (await db.projects.toArray()).toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    ['projects'],
  );
}
