import * as React from 'react';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu';
import { Icons } from '../Icons';
import { useDataTable } from './context';

/**
 * Pagination
 * Renders "start-end of total" and ghost chevron buttons for prev/next.
 * Uses the TanStack table instance from DataTable context.
 */
export function Pagination() {
  const { table } = useDataTable<any>();
  const { pageIndex, pageSize } = table.getState().pagination ?? { pageIndex: 0, pageSize: 50 };

  const total = table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="mr-2 flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary/80 px-2 text-sm leading-tight"
            aria-label="Rows per page"
          >
            {`${start}-${end} of ${total}`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {[25, 50, 100].map(size => (
            <DropdownMenuItem
              key={size}
              onSelect={e => {
                e.preventDefault();
                table.setPageSize(size);
              }}
              className="flex items-center gap-[2px]"
            >
              <Icons.Checked className={`h-6 w-6 ${pageSize === size ? '' : 'invisible'}`} />
              {size} per page
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous page"
        onClick={() => table.previousPage()}
        disabled={!canPrev}
        className="ml-1"
      >
        <Icons.ChevronLeft className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next page"
        onClick={() => table.nextPage()}
        disabled={!canNext}
      >
        <Icons.ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
