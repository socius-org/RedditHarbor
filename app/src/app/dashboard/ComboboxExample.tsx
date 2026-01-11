'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import {
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
} from '#app/components/ui/combobox.tsx';

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
    // Delete last chip on backspace when input is empty
    if (event.key === 'Backspace' && query === '' && selected.length > 0) {
      setSelected((prev) => prev.slice(0, -1));
      return;
    }

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
    <Combobox
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
        <ComboboxChips ref={containerRef}>
          <ComboboxValue>
            {(value: LabelItem[]) => (
              <React.Fragment>
                {value.map((label) => (
                  <ComboboxChip key={label.id} aria-label={label.value}>
                    {label.value}
                    <ComboboxChipRemove />
                  </ComboboxChip>
                ))}
                <ComboboxInput
                  id={id}
                  placeholder={value.length > 0 ? '' : 'e.g. bug'}
                  onKeyDown={handleInputKeyDown}
                />
              </React.Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
      </div>

      <ComboboxContent anchor={containerRef}>
        <ComboboxEmpty>No labels found.</ComboboxEmpty>
        <ComboboxList>
          {(item: LabelItem) =>
            item.creatable ? (
              <ComboboxItem key={item.id} value={item}>
                <Plus className="col-start-1 size-4" />
                <span className="col-start-2">Create "{item.creatable}"</span>
              </ComboboxItem>
            ) : (
              <ComboboxItem key={item.id} value={item}>
                <ComboboxItemIndicator />
                <span className="col-start-2">{item.value}</span>
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
