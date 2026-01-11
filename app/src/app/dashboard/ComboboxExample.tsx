'use client';

import * as React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Combobox } from '@base-ui/react/combobox';

interface LabelItem {
  creatable?: string;
  id: string;
  value: string;
}

const initialLabels: LabelItem[] = [
  { id: 'bug', value: 'bug' },
  { id: 'docs', value: 'documentation' },
  { id: 'enhancement', value: 'enhancement' },
  { id: 'help-wanted', value: 'help wanted' },
  { id: 'good-first-issue', value: 'good first issue' },
];

export function ComboboxExample() {
  const id = React.useId();

  const [labels, setLabels] = React.useState<LabelItem[]>(initialLabels);
  const [selected, setSelected] = React.useState<LabelItem[]>([]);
  const [query, setQuery] = React.useState('');

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const highlightedItemRef = React.useRef<LabelItem | undefined>(undefined);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || highlightedItemRef.current) {
      return;
    }

    const currentTrimmed = query.trim();
    if (currentTrimmed === '') {
      return;
    }

    // Prevent form submission when creating items
    event.preventDefault();

    const normalized = currentTrimmed.toLocaleLowerCase();
    const existing = labels.find((label) => label.value.trim().toLocaleLowerCase() === normalized);

    if (existing) {
      setSelected((prev) =>
        prev.some((item) => item.id === existing.id) ? prev : [...prev, existing],
      );
      setQuery('');
      return;
    }

    // Create new item directly (no dialog)
    const baseId = normalized.replace(/\s+/g, '-');
    const existingIds = new Set(labels.map((l) => l.id));
    let uniqueId = baseId;
    if (existingIds.has(uniqueId)) {
      let i = 2;
      while (existingIds.has(`${baseId}-${i}`)) {
        i += 1;
      }
      uniqueId = `${baseId}-${i}`;
    }
    const newItem: LabelItem = { id: uniqueId, value: currentTrimmed };
    setLabels((prev) => [...prev, newItem]);
    setSelected((prev) => [...prev, newItem]);
    setQuery('');
  }

  const trimmed = query.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const exactExists = labels.some((l) => l.value.trim().toLocaleLowerCase() === lowered);
  const itemsForView: LabelItem[] =
    trimmed !== '' && !exactExists
      ? [...labels, { creatable: trimmed, id: `create:${lowered}`, value: `Create "${trimmed}"` }]
      : labels;

  return (
    <Combobox.Root
      items={itemsForView}
      multiple
      onValueChange={(next) => {
        const creatableSelection = next.find(
          (item) => item.creatable && !selected.some((current) => current.id === item.id),
        );

        if (creatableSelection?.creatable) {
          const normalized = creatableSelection.creatable.toLocaleLowerCase();
          const baseId = normalized.replace(/\s+/g, '-');
          const existingIds = new Set(labels.map((l) => l.id));
          let uniqueId = baseId;
          if (existingIds.has(uniqueId)) {
            let i = 2;
            while (existingIds.has(`${baseId}-${i}`)) {
              i += 1;
            }
            uniqueId = `${baseId}-${i}`;
          }
          const newItem: LabelItem = { id: uniqueId, value: creatableSelection.creatable };
          setLabels((prev) => [...prev, newItem]);
          setSelected((prev) => [...prev, newItem]);
          setQuery('');
          return;
        }
        const clean = next.filter((i) => !i.creatable);
        setSelected(clean);
        setQuery('');
      }}
      value={selected}
      inputValue={query}
      onInputValueChange={setQuery}
      onItemHighlighted={(item) => {
        highlightedItemRef.current = item;
      }}
    >
      <div className="flex max-w-[28rem] flex-col gap-1">
        <label className="text-sm font-medium leading-5" htmlFor={id}>
          Labels
        </label>
        <Combobox.Chips
          className="border-input focus-within:border-ring focus-within:ring-ring/50 flex min-w-0 flex-wrap items-center gap-0.5 rounded-md border bg-transparent px-1.5 py-1 focus-within:ring-[3px]"
          ref={containerRef}
        >
          <Combobox.Value>
            {(value: LabelItem[]) => (
              <React.Fragment>
                {value.map((label) => (
                  <Combobox.Chip
                    key={label.id}
                    className="bg-secondary text-secondary-foreground data-highlighted:bg-primary data-highlighted:text-primary-foreground focus-within:bg-primary focus-within:text-primary-foreground flex cursor-default items-center gap-1 rounded-md px-1.5 py-0.5 text-sm outline-none"
                    aria-label={label.value}
                  >
                    {label.value}
                    <Combobox.ChipRemove
                      className="hover:bg-secondary-foreground/20 rounded p-0.5 text-inherit"
                      aria-label="Remove"
                    >
                      <X className="size-3" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
                <Combobox.Input
                  id={id}
                  placeholder={value.length > 0 ? '' : 'e.g. bug'}
                  className="placeholder:text-muted-foreground h-8 min-w-12 flex-1 bg-transparent pl-2 text-sm outline-none"
                  onKeyDown={handleInputKeyDown}
                />
              </React.Fragment>
            )}
          </Combobox.Value>
        </Combobox.Chips>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={4} anchor={containerRef}>
          <Combobox.Popup className="bg-popover text-popover-foreground w-[var(--anchor-width)] max-h-[min(var(--available-height),24rem)] max-w-[var(--available-width)] overflow-y-auto scroll-py-1 overscroll-contain rounded-lg border p-1 shadow-lg">
            <Combobox.Empty className="text-muted-foreground px-2 py-1.5 text-center text-sm">
              No labels found.
            </Combobox.Empty>
            <Combobox.List>
              {(item: LabelItem) =>
                item.creatable ? (
                  <Combobox.Item
                    key={item.id}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-none select-none"
                    value={item}
                  >
                    <Plus className="col-start-1 size-4" />
                    <span className="col-start-2">Create "{item.creatable}"</span>
                  </Combobox.Item>
                ) : (
                  <Combobox.Item
                    key={item.id}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-none select-none"
                    value={item}
                  >
                    <Combobox.ItemIndicator className="col-start-1">
                      <Check className="size-4" />
                    </Combobox.ItemIndicator>
                    <span className="col-start-2">{item.value}</span>
                  </Combobox.Item>
                )
              }
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
