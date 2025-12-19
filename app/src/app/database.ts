import Dexie, { type EntityTable } from 'dexie';
import type { Project } from './actions/project';

// https://dexie.org/docs/Tutorial/React
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const db = new Dexie('RedditHarbor') as Dexie & {
  projects: EntityTable<Project, 'id'>;
};

db.version(1).stores({
  projects: 'id, updatedAt',
});

export { db };
