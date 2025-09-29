import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../src/components/Resizable';
import { ScrollArea } from '../src/components/ScrollArea';
import { Button } from '../src/components/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../src/components/Table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../src/components/DropdownMenu';
import { Input } from '../src/components/Input';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
  Column,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import data from './patient-studies.json';
import { PanelDefault } from './panel-default';
import { PanelContent, type StudyRow } from './panel-content';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (originalRow: TData, index: number) => string;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  singleRowSelection?: boolean;
  showColumnVisibilityControls?: boolean;
  tableClassName?: string;
  onRowSelectionChange?: (selectedRows: TData[], rowSelection: RowSelectionState) => void;
  title?: React.ReactNode;
}

function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  initialSorting = [],
  initialColumnVisibility = {},
  singleRowSelection = true,
  showColumnVisibilityControls = true,
  tableClassName,
  onRowSelectionChange,
  title,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
    <div className="flex h-full flex-col">
      {(showColumnVisibilityControls || title) && (
        <div className="flex items-center justify-between gap-2 py-2">
          <div className="text-foreground text-xl">{title}</div>
          {showColumnVisibilityControls && (
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
          )}
        </div>
      )}
      <div className="border-input/50 min-h-0 flex-1 overflow-hidden rounded-md border">
        <ScrollArea className="h-full">
          <div className="h-full overflow-x-auto">
            <Table
              className={tableClassName}
              containerClassName="h-full"
              noScroll
            >
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="bg-muted sticky top-0 z-10"
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
                <TableRow
                  data-filter-row
                  className="hover:bg-transparent"
                >
                  {table.getVisibleLeafColumns().map(col => (
                    <TableCell
                      key={col.id}
                      className={col.id === 'instances' ? 'text-right' : undefined}
                    >
                      {col.id === 'instances' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setColumnFilters([])}
                          aria-label="Reset filters"
                        >
                          Reset
                        </Button>
                      ) : (
                        <Input
                          value={(table.getColumn(col.id)?.getFilterValue() as string) ?? ''}
                          onChange={e => table.getColumn(col.id)?.setFilterValue(e.target.value)}
                          className="h-7 w-full"
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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
        </ScrollArea>
      </div>
    </div>
  );
}

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  align?: 'left' | 'center' | 'right';
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = 'left',
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted() as false | 'asc' | 'desc';
  const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕';

  const justifyClass =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex items-center ${justifyClass} w-full gap-1`}>
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

const App = () => {
  const [layout, setLayout] = React.useState<'right' | 'bottom'>('right');
  const [selected, setSelected] = React.useState<StudyRow | null>(null);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup
          direction={layout === 'right' ? 'horizontal' : 'vertical'}
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={70}>
            <div className="flex h-full w-full flex-col p-3">
              <div className="min-h-0 flex-1">
                <div className="bg-background h-full rounded-md p-2">
                  <DataTable<StudyRow, unknown>
                    columns={columns}
                    data={data as StudyRow[]}
                    getRowId={row => row.accession}
                    singleRowSelection={true}
                    showColumnVisibilityControls={true}
                    title="Study List"
                    tableClassName="min-w-[1000px]"
                    onRowSelectionChange={rows => setSelected(rows[0] ?? null)}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel
            defaultSize={30}
            minSize={15}
          >
            <SidePanel
              layout={layout}
              selected={selected}
              onToggleLayout={() => setLayout(layout === 'right' ? 'bottom' : 'right')}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeWrapper>
  );
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);

function SidePanel({
  layout,
  selected,
  onToggleLayout,
}: {
  layout: 'right' | 'bottom';
  selected: StudyRow | null;
  onToggleLayout: () => void;
}) {
  const isRight = layout === 'right';
  const headerTitle = isRight ? 'Right Panel' : 'Bottom Panel';

  return (
    <div className="bg-background flex h-full w-full flex-col">
      <div className="bg-background text-primary flex h-10 items-center justify-between px-3 text-sm">
        <span>{headerTitle}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleLayout}
        >
          {isRight ? 'Move to Bottom' : 'Move to Right'}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {selected ? (
            <PanelContent
              key={selected.accession}
              study={selected}
              layout={layout}
            />
          ) : (
            <PanelDefault layout={layout} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

const columns: ColumnDef<StudyRow, unknown>[] = [
  {
    accessorKey: 'patient',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Patient"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('patient')}</div>,
  },
  {
    accessorKey: 'mrn',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="MRN"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('mrn')}</div>,
  },
  {
    accessorKey: 'studyDateTime',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Study Date"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('studyDateTime')}</div>,
    sortingFn: (a, b, colId) =>
      new Date(a.getValue(colId) as string).getTime() -
      new Date(b.getValue(colId) as string).getTime(),
  },
  {
    accessorKey: 'modalities',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Modalities"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('modalities')}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
      />
    ),
    cell: ({ row }) => <div>{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'accession',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Accession"
      />
    ),
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('accession')}</div>,
  },
  {
    accessorKey: 'instances',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Instances"
        align="right"
      />
    ),
    cell: ({ row }) => <div className="text-right">{row.getValue('instances')}</div>,
    sortingFn: (a, b, colId) => (a.getValue(colId) as number) - (b.getValue(colId) as number),
  },
];
