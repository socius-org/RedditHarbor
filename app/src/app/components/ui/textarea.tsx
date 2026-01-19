'use client';

import type * as React from 'react';
import { Field as FieldPrimitive } from '@base-ui/react/field';

import { cn } from '#app/utils/cn.ts';
import { useFieldContext } from '#app/components/ui/field.tsx';

function Textarea({ className, required, ...props }: React.ComponentProps<'textarea'>) {
  const fieldContext = useFieldContext();

  return (
    <FieldPrimitive.Control
      required={required ?? fieldContext?.required}
      data-slot="textarea"
      className={cn(
        'border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] md:text-sm',
        className,
      )}
      render={<textarea {...props} />}
    />
  );
}

export { Textarea };
