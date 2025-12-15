import * as React from 'react';
import type { Column } from '@tanstack/react-table';
import { Button } from '../Button';
import { Icons } from '../Icons';
import type { ColumnMeta } from './types';

export function ColumnHeader<TData, TValue>({ column }: { column: Column<TData, TValue> }) {
  const meta = (column.columnDef.meta as ColumnMeta | undefined) ?? undefined;

  // Use headerContent if provided, otherwise use label
  const content = meta?.headerContent ?? meta?.label ?? column.id;
  const align = meta?.align ?? 'left';
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted() as false | 'asc' | 'desc';
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  const SortIcon =
    sorted === 'asc'
      ? Icons.SortingNewAscending
      : sorted === 'desc'
        ? Icons.SortingNewDescending
        : Icons.SortingNew;

  const ariaLabel = meta?.label ?? column.id;

  return (
    <div className={`flex w-full items-center gap-1 ${justify}`}>
      {typeof content === 'string' ? <span>{content}</span> : content}
      {canSort && (
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
      )}
    </div>
  );
}
