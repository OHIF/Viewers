import * as React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTableContext } from './context'

type Props<TData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  getRowId?: (row: TData, index: number) => string
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
  initialFilters?: ColumnFiltersState
  enforceSingleSelection?: boolean
  onSelectionChange?: (rows: TData[]) => void
  children: React.ReactNode
}

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  initialVisibility = {},
  initialFilters = [],
  enforceSingleSelection = true,
  onSelectionChange,
  children,
}: Props<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibility)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters)

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
    const selected = table.getSelectedRowModel().rows.map((r) => r.original as TData)
    onSelectionChange(selected)
  }, [rowSelection, onSelectionChange, table])

  const value = React.useMemo(
    () => ({
      table,
      sorting,
      setSorting,
      columnVisibility,
      setColumnVisibility,
      rowSelection,
      setRowSelection,
      columnFilters,
      setColumnFilters,
      resetFilters: () => setColumnFilters([]),
    }),
    [table, sorting, columnVisibility, rowSelection, columnFilters]
  )

  return <DataTableContext.Provider value={value}>{children}</DataTableContext.Provider>
}

