'use client';

import type { ReactNode } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSuspendingLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ArrowRightLeft, BarChart3, Database, Lock, Shield, Upload } from 'lucide-react';
import { Button } from '#app/components/ui/button.tsx';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#app/components/ui/empty.tsx';
import { PageContainer } from '#app/components/ui/PageContainer.tsx';
import { cn } from '#app/utils/cn.ts';
import { db } from '#app/database.ts';

const PHASES = [
  { key: 'privacy', label: 'Privacy', icon: Shield, number: 1, enabled: true },
  { key: 'extract', label: 'Extract', icon: Database, number: 2, enabled: false },
  { key: 'transform', label: 'Transform', icon: ArrowRightLeft, number: 3, enabled: false },
  { key: 'load', label: 'Load', icon: Upload, number: 4, enabled: false },
  { key: 'present', label: 'Present', icon: BarChart3, number: 5, enabled: false },
] as const;

type ProjectLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { id } = use(params);
  const project = useSuspendingLiveQuery(() => db.projects.get(id), ['projects', id]);
  const pathname = usePathname();

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
    <div className="flex min-h-[calc(100vh-49px)]">
      <aside className="border-border hidden w-60 shrink-0 border-r p-4 md:block">
        <div className="flex flex-col gap-4">
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
          <h1 className="text-lg font-medium">{project.title}</h1>
          <nav className="flex flex-col gap-1" aria-label="Phases">
            {PHASES.map((phase) => {
              const isActive = pathname.includes(`/${phase.key}`);

              if (!phase.enabled) {
                return (
                  <div
                    key={phase.key}
                    className="text-muted-foreground/50 flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs">
                      <Lock className="size-3" />
                    </span>
                    <span>{phase.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={phase.key}
                  href={`/dashboard/project/${id}/${phase.key}`}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {phase.number}
                  </span>
                  <span>{phase.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
