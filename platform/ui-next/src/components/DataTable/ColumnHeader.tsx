import * as React from 'react';
import { Subscribe } from '@tanstack/react-table';
import type { Column } from '@tanstack/react-table';
import type { DataTableFeatures } from './DataTable';
import { Button } from '../Button';
import { Icons } from '../Icons';
import type { ColumnMeta } from './types';

export function ColumnHeader<TData, TValue>({
  column,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
}) {
  const meta = (column.columnDef.meta as ColumnMeta | undefined) ?? undefined;

  // Use headerContent if provided, otherwise use label
  const content = meta?.headerContent ?? meta?.label ?? column.id;
  const align = meta?.align ?? 'left';
  // Static column config — never changes at runtime, so a direct (and
  // compiler-cached) read is correct.
  const canSort = column.getCanSort();
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  const ariaLabel = meta?.label ?? column.id;

  return (
    <div className={`flex w-full items-center gap-1 ${justify}`}>
      {typeof content === 'string' ? <span>{content}</span> : content}
      {canSort && (
        // The sort direction is table STATE read through `column`, an object
        // whose identity is stable across renders — a compiled
        // column.getIsSorted() here would freeze at mount. Subscribe moves the
        // read outside this compiled component and hands the value in as a
        // function argument, which the compiler cannot hoist or cache.
        // Everything sort-dependent must be derived from that argument.
        <Subscribe
          source={column.table.atoms.sorting}
          selector={sorting => {
            const entry = sorting.find(s => s.id === column.id);
            return entry ? (entry.desc ? 'desc' : 'asc') : (false as const);
          }}
        >
          {sorted => {
            const SortIcon =
              sorted === 'asc'
                ? Icons.SortingNewAscending
                : sorted === 'desc'
                  ? Icons.SortingNewDescending
                  : Icons.SortingNew;
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(sorted === 'asc')}
                aria-label={`Sort ${ariaLabel}`}
                className="px-1"
              >
                <SortIcon
                  className="h-4 w-2.5"
                  aria-hidden="true"
                />
              </Button>
            );
          }}
        </Subscribe>
      )}
    </div>
  );
}
