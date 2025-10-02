import * as React from 'react'
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTableFilterRow, DataTableViewOptions } from '../../src/components/DataTable'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../src/components/Table'
import { ScrollArea } from '../../src/components/ScrollArea'
import type { StudyRow } from './types'

type Props = {
  columns: ColumnDef<StudyRow, unknown>[]
  data: StudyRow[]
  title?: React.ReactNode
  getRowId?: (row: StudyRow, index: number) => string
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
  enforceSingleSelection?: boolean
  showColumnVisibility?: boolean
  tableClassName?: string
  onSelectionChange?: (rows: StudyRow[]) => void
}

export function StudyListTable({
  columns,
  data,
  title,
  getRowId,
  initialSorting = [],
  initialVisibility = {},
  enforceSingleSelection = true,
  showColumnVisibility = true,
  tableClassName,
  onSelectionChange,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibility)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

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
    enableMultiRowSelection: !enforceSingleSelection,
    getRowId,
  })

  React.useEffect(() => {
    if (!onSelectionChange) return
    const selected = table.getSelectedRowModel().rows.map((r) => r.original as StudyRow)
    onSelectionChange(selected)
  }, [rowSelection, onSelectionChange, table])

  return (
    <div className="flex h-full flex-col">
      {(showColumnVisibility || title) && (
        <div className="relative flex items-center justify-center py-4">
          {title ? <div className="text-primary text-[20px] font-medium">{title}</div> : null}
          {showColumnVisibility && (
            <div className="absolute right-0">
              <DataTableViewOptions
                table={table}
                getLabel={(id) => {
                  const label = (table.getColumn(id)?.columnDef.meta as { label?: string } | undefined)?.label
                  return label ?? id
                }}
              />
            </div>
          )}
        </div>
      )}
      <div className="border-input/50 min-h-0 flex-1 rounded-md border">
        <ScrollArea className="h-full">
          <Table className={tableClassName} containerClassName="h-full" noScroll>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="bg-muted sticky top-0 z-10"
                      aria-sort={(() => {
                        const s = header.column.getIsSorted() as false | 'asc' | 'desc'
                        return s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none'
                      })()}
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
              <DataTableFilterRow
                table={table}
                resetCellId="instances"
                onReset={() => setColumnFilters([])}
                excludeColumnIds={[]}
              />
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    onClick={() => row.toggleSelected()}
                    aria-selected={row.getIsSelected()}
                    className="group cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}
