import * as React from 'react';
import type { Table } from '@tanstack/react-table';

export type DataTableContextValue<TData> = {
  table: Table<TData>;
};

const DataTableContext = React.createContext<DataTableContextValue<unknown> | null>(null);

export function useDataTable<TData>() {
  const ctx = React.useContext(DataTableContext);
  if (!ctx) {
    throw new Error('useDataTable must be used within a <DataTable> provider');
  }
  return ctx as DataTableContextValue<TData>;
}

export { DataTableContext };
