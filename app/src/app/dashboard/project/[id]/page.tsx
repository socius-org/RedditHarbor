'use client';

import { use } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft } from 'lucide-react';
import { Button } from '#app/components/ui/button.tsx';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#app/components/ui/empty.tsx';
import { db } from '#app/database.ts';

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const project = useLiveQuery(() => db.projects.get(id), [id]);

  if (project === undefined) {
    return (
      <div className="mx-auto max-w-300 px-4 py-6 sm:px-6">
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyTitle>Project not found</EmptyTitle>
            <EmptyDescription>
              This project doesn&apos;t exist or may have been deleted.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            <ArrowLeft />
            Back to dashboard
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-300 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground mb-2 -ml-2.5"
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft />
            Back to dashboard
          </Button>
          <h1 className="text-xl font-medium">{project.title}</h1>
          {project.researchObjective && (
            <p className="text-muted-foreground mt-1">{project.researchObjective}</p>
          )}
        </div>
      </div>
    </div>
  );
}
