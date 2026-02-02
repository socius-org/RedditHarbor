'use client';

import { createContext, use } from 'react';
import { Field as FieldPrimitive } from '@base-ui/react/field';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#app/utils/cn.ts';
import { Label } from '#app/components/ui/label.tsx';
import { Separator } from '#app/components/ui/separator.tsx';

type FieldContextValue = {
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | undefined>(undefined);

export function useFieldContext() {
  return use(FieldContext);
}

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        'flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base',
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-4 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
        className,
      )}
      {...props}
    />
  );
}

// See: https://github.com/mui/base-ui/issues/3718#issuecomment-3765820832
const fieldVariants = cva(
  cn(
    'data-invalid:text-destructive group/field flex w-full gap-2',
    // `Select`'s hidden input uses absolute positioning (set by Base UI),
    // so `Field` needs to be a positioning context when it contains a `Select`.
    'has-data-[slot=select-trigger]:relative',
    // `Combobox`'s hidden input is repositioned flush below the chips to align native
    // validation messages. `static` overrides Base UI's `position: absolute` to put it
    // back in flow. `-mt-3` (0.75rem) offsets `gap-2` (0.5rem) + chips' `py-1` (0.25rem).
    '[&_[data-slot=combobox-chips]+input[aria-hidden=true]]:static!',
    '[&_[data-slot=combobox-chips]+input[aria-hidden=true]]:-mt-3!',
    '[&_[data-slot=combobox-chips]+input[aria-hidden=true]]:w-full!',
    // `mb-0.75` (3px) restores the original gap when a description or error follows,
    // since being in flow adds an extra `gap-2`: 8 + (-12) + 1 + 3 + 8 = 8px.
    'has-data-[slot=field-description]:[&_[data-slot=combobox-chips]+input[aria-hidden=true]]:mb-0.75!',
    'has-data-[slot=field-error]:[&_[data-slot=combobox-chips]+input[aria-hidden=true]]:mb-0.75!',
  ),
  {
    variants: {
      orientation: {
        vertical: 'flex-col [&>*]:w-full [&>.sr-only]:w-auto',
        horizontal:
          'flex-row items-center has-[>[data-slot=field-content]]:items-start [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        responsive:
          'flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:has-[>[data-slot=field-content]]:items-start [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

function Field({
  className,
  orientation = 'vertical',
  required = false,
  ...props
}: FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants> & { required?: boolean }) {
  return (
    <FieldContext value={{ required }}>
      <FieldPrimitive.Root
        role="group"
        data-slot="field"
        data-orientation={orientation}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    </FieldContext>
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn('group/field-content flex flex-1 flex-col gap-0.5 leading-snug', className)}
      {...props}
    />
  );
}

function FieldLabel({ children, className, ...props }: React.ComponentProps<typeof Label>) {
  const fieldContext = useFieldContext();

  return (
    <Label
      data-slot="field-label"
      className={cn(
        'has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-2.5',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
        className,
      )}
      {...props}
    >
      {fieldContext?.required ? (
        <>
          {children}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </>
      ) : (
        children
      )}
    </Label>
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(
        'text-muted-foreground text-left text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance [[data-variant=legend]+&]:-mt-1.5',
        'last:mt-0 nth-last-2:-mt-1',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="text-muted-foreground bg-background relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  render,
  ...props
}: useRender.ComponentProps<'div'> & {
  errors?: ({ message?: string } | undefined)[];
}) {
  const content = (() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  })();

  const element = useRender({
    defaultTagName: 'div',
    render,
    props: {
      ...props,
      role: 'alert',
      'data-slot': 'field-error',
      className: cn('text-destructive text-sm font-normal', className),
      children: content,
    },
  });

  if (!content) {
    return null;
  }

  return element;
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
