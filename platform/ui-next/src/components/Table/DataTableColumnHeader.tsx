import * as React from 'react';
import type { Column } from '@tanstack/react-table';
import { Button } from '../Button';

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  align?: 'left' | 'center' | 'right';
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = 'left',
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted() as false | 'asc' | 'desc';
  const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕';

  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex items-center ${justifyClass} gap-1 w-full`}>
      <span>{title}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(sorted === 'asc')}
        aria-label={`Sort ${title}`}
        className="px-1"
      >
        {indicator}
      </Button>
    </div>
  );
}

