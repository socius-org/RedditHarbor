'use client';

import type { ComponentPropsWithRef } from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { Check, X } from 'lucide-react';

import { cn } from '#app/utils/cn.ts';

const Combobox = ComboboxPrimitive.Root;

function ComboboxChips({
  className,
  ...props
}: ComponentPropsWithRef<typeof ComboboxPrimitive.Chips>) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-transparent px-2 py-1.5 transition-colors focus-within:ring-[3px] aria-invalid:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({ className, children, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ChipRemove
        className="hover:bg-secondary-foreground/20 -mr-1 flex size-4 items-center justify-center rounded"
        aria-label="Remove"
      >
        <X className="size-3" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        'placeholder:text-muted-foreground min-w-20 flex-1 bg-transparent text-sm outline-none',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxPopup({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'anchor' | 'side' | 'sideOffset'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-popup"
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg shadow-md ring-1 duration-100 relative isolate z-50 max-h-[min(var(--available-height),20rem)] w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto p-1',
            className,
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <ComboboxItemIndicator />
      <span>{children}</span>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxItemIndicator({ className, ...props }: ComboboxPrimitive.ItemIndicator.Props) {
  return (
    <ComboboxPrimitive.ItemIndicator
      data-slot="combobox-item-indicator"
      className={cn('col-start-1', className)}
      {...props}
    >
      <Check className="size-4" />
    </ComboboxPrimitive.ItemIndicator>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn('text-muted-foreground py-2 px-2 text-center text-sm', className)}
      {...props}
    />
  );
}

const ComboboxList = ComboboxPrimitive.List;
const ComboboxValue = ComboboxPrimitive.Value;

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
};
