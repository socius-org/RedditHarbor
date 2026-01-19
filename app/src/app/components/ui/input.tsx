'use client';

import type { ComponentProps, Key } from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '#app/utils/cn.ts';
import { useFieldContext } from '#app/components/ui/field.tsx';

function Input({ className, defaultValue, required, type, ...props }: ComponentProps<'input'>) {
  const fieldContext = useFieldContext();

  let key: Key | undefined;
  if (typeof defaultValue === 'string' || typeof defaultValue === 'number') {
    key = defaultValue;
  } else if (Array.isArray(defaultValue)) {
    key = defaultValue.join(',');
  }

  return (
    <InputPrimitive
      key={key}
      type={type}
      required={required ?? fieldContext?.required}
      defaultValue={defaultValue}
      data-slot="input"
      className={cn(
        'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:text-foreground placeholder:text-muted-foreground h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
