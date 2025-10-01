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
import { Button } from '../../src/components/Button'
import { Input } from '../../src/components/Input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '../../src/components/DropdownMenu'
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((c) => c.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(v) => column.toggleVisibility(!!v)}
                        className="capitalize"
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <TableHead key={header.id} className="bg-muted sticky top-0 z-10">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <TableRow data-filter-row className="hover:bg-transparent">
                {table.getVisibleLeafColumns().map((col) => (
                  <TableCell key={col.id} className={col.id === 'instances' ? 'text-right' : undefined}>
                    {col.id === 'instances' ? (
                      <Button variant="ghost" size="sm" onClick={() => setColumnFilters([])} aria-label="Reset filters">
                        Reset
                      </Button>
                    ) : (
                      <Input
                        value={(table.getColumn(col.id)?.getFilterValue() as string) ?? ''}
                        onChange={(e) => table.getColumn(col.id)?.setFilterValue(e.target.value)}
                        className="h-7 w-full"
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
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
