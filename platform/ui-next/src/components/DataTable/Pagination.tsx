import * as React from 'react';
import { Button } from '../Button';
import { useDataTable } from './context';

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" {...props}>
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" {...props}>
      <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor" />
    </svg>
  );
}

/**
 * DataTablePagination
 * Renders "start-end of total" and ghost chevron buttons for prev/next.
 * Uses the TanStack table instance from DataTable context.
 */
export function DataTablePagination() {
  const { table } = useDataTable<any>();
  const { pageIndex, pageSize } = table.getState().pagination ?? { pageIndex: 0, pageSize: 50 };

  const total = table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex items-center gap-1 mr-2">
      <span className="text-primary/80 text-sm leading-tight">{`${start}-${end} of ${total}`}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous page"
        onClick={() => table.previousPage()}
        disabled={!canPrev}
        className="ml-1"
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next page"
        onClick={() => table.nextPage()}
        disabled={!canNext}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}