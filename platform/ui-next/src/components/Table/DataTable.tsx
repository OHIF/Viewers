import * as React from 'react';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './Table';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../DropdownMenu';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (originalRow: TData, index: number) => string;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  singleRowSelection?: boolean; // default: true
  showColumnVisibilityControls?: boolean; // default: true
  tableClassName?: string;
  onRowSelectionChange?: (selectedRows: TData[], rowSelection: RowSelectionState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  initialSorting = [],
  initialColumnVisibility = {},
  singleRowSelection = true,
  showColumnVisibilityControls = true,
  tableClassName,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: singleRowSelection ? false : true,
    getRowId,
  });

  React.useEffect(() => {
    if (!onRowSelectionChange) return;
    const selected = table.getSelectedRowModel().rows.map(r => r.original as TData);
    onRowSelectionChange(selected, rowSelection);
  }, [rowSelection, table, onRowSelectionChange]);

  return (
    <div className="border-input flex h-full flex-col overflow-hidden rounded-md border">
      {showColumnVisibilityControls && (
        <div className="flex items-center">
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(col => col.getCanHide())
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={v => column.toggleVisibility(!!v)}
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Table
          className={tableClassName}
          containerClassName="h-full"
        >
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="bg-background sticky top-0 z-10"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => row.toggleSelected()}
                  aria-selected={row.getIsSelected()}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
