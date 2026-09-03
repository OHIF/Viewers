import { createContext, useContext } from 'react';
import type { Table } from '@tanstack/react-table';

export type DataTableContextValue<TData> = {
  table: Table<TData>;
};

// React Context cannot be generic, so we use 'unknown' as the base type
// The generic type is properly restored by useDataTable<TData>() via type assertion
const DataTableContext = createContext<DataTableContextValue<unknown> | null>(null);

export function useDataTable<TData>() {
  const ctx = useContext(DataTableContext);
  if (!ctx) {
    throw new Error('useDataTable must be used within a <DataTable> provider');
  }
  return ctx as DataTableContextValue<TData>;
}

export { DataTableContext };
