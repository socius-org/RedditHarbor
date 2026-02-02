import type { ComponentProps } from 'react';
import { cn } from '#app/utils/cn.ts';

export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto max-w-300 px-4 py-6 sm:px-6', className)} {...props} />;
}
