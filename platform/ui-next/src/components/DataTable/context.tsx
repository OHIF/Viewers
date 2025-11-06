import * as React from 'react'
import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  Table as RTable,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table'

export type DataTableContextValue<TData> = {
  table: RTable<TData>
  sorting: SortingState
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  columnFilters: ColumnFiltersState
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  resetFilters: () => void
}

const DataTableContext = React.createContext<DataTableContextValue<any> | null>(null)

export function useDataTable<TData>() {
  const ctx = React.useContext(DataTableContext)
  if (!ctx) throw new Error('useDataTable must be used within a <DataTable> provider')
  return ctx as DataTableContextValue<TData>
}

export { DataTableContext }

