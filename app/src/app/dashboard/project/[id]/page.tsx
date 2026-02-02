'use client';

import { use } from 'react';
import Link from 'next/link';
import { useSuspendingLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft } from 'lucide-react';
import { Button } from '#app/components/ui/button.tsx';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#app/components/ui/empty.tsx';
import { PageContainer } from '#app/components/ui/PageContainer.tsx';
import { db } from '#app/database.ts';

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const project = useSuspendingLiveQuery(() => db.projects.get(id), ['projects', id]);

  if (!project) {
    return (
      <PageContainer>
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyTitle>Project not found</EmptyTitle>
            <EmptyDescription>
              This project doesn&apos;t exist or may have been deleted.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            <ArrowLeft />
            Back to dashboard
          </Button>
        </Empty>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-2">
      <Button
        variant="link"
        size="sm"
        nativeButton={false}
        // Negative margin offsets the button's px-2.5 padding to align text with content below
        className="text-muted-foreground -ml-2.5 self-start"
        render={<Link href="/dashboard" />}
      >
        <ArrowLeft />
        Back to dashboard
      </Button>
      <h1 className="text-xl font-medium">{project.title}</h1>
      {project.researchObjective && (
        <p className="text-muted-foreground">{project.researchObjective}</p>
      )}
    </PageContainer>
  );
}
