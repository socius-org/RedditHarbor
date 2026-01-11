'use client';

import type * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { Check, X } from 'lucide-react';

import { cn } from '#app/utils/cn.ts';

const Combobox = ComboboxPrimitive.Root;

const ComboboxValue = ComboboxPrimitive.Value;

const ComboboxList = ComboboxPrimitive.List;

function ComboboxChips({
  className,
  ref,
  ...props
}: ComboboxPrimitive.Chips.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <ComboboxPrimitive.Chips
      ref={ref}
      data-slot="combobox-chips"
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 flex min-w-0 flex-wrap items-center gap-0.5 rounded-md border bg-transparent px-1.5 py-1 focus-within:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({ className, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'bg-secondary text-secondary-foreground data-highlighted:bg-primary data-highlighted:text-primary-foreground focus-within:bg-primary focus-within:text-primary-foreground flex cursor-default items-center gap-1 rounded-md px-1.5 py-0.5 text-sm outline-none',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({ className, children, ...props }: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      className={cn('hover:bg-secondary-foreground/20 rounded p-0.5 text-inherit', className)}
      aria-label="Remove"
      {...props}
    >
      {children ?? <X className="size-3" />}
    </ComboboxPrimitive.ChipRemove>
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        'placeholder:text-muted-foreground h-8 min-w-12 flex-1 bg-transparent pl-2 text-sm outline-none',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxContent({
  className,
  children,
  sideOffset = 4,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, 'sideOffset' | 'anchor'>) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        className="z-50 outline-none"
        sideOffset={sideOffset}
        anchor={anchor}
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            'bg-popover text-popover-foreground w-[var(--anchor-width)] max-h-[min(var(--available-height),24rem)] max-w-[var(--available-width)] overflow-y-auto scroll-py-1 overscroll-contain rounded-lg border p-1 shadow-lg',
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

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn('text-muted-foreground px-2 py-1.5 text-center text-sm', className)}
      {...props}
    />
  );
}

function ComboboxItem({ className, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-none select-none',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: ComboboxPrimitive.ItemIndicator.Props) {
  return (
    <ComboboxPrimitive.ItemIndicator
      data-slot="combobox-item-indicator"
      className={cn('col-start-1', className)}
      {...props}
    >
      {children ?? <Check className="size-4" />}
    </ComboboxPrimitive.ItemIndicator>
  );
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxValue,
};
