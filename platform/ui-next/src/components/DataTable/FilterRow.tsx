// React Compiler opt-out — PERMANENT, not cleanup debt. Do not remove.
// TanStack Table's state lives behind methods on objects whose identity is stable
// across renders, so compiled reads of it freeze at mount.
// See DataTable.tsx for the full explanation.
'use no memo';

import * as React from 'react';
import { TableRow, TableCell } from '../Table';
import { Input } from '../Input';

import { useDataTable } from './context';

export type FilterRowProps = {
  excludeColumnIds?: string[];
  renderFilterCell?: (opts: {
    columnId: string;
    value: unknown;
    setValue: (v: unknown) => void;
  }) => React.ReactNode;
};

export function FilterRow<TData>({ excludeColumnIds = [], renderFilterCell }: FilterRowProps) {
  const { table } = useDataTable<TData>();
  const cols = table.getVisibleLeafColumns();
  return (
    <TableRow
      data-filter-row
      className="hover:bg-transparent"
    >
      {cols.map(col => {
        const id = col.id;
        const value = table.getColumn(id)?.getFilterValue();
        const setValue = (v: unknown) => table.getColumn(id)?.setFilterValue(v);

        if (excludeColumnIds?.includes(id)) {
          return <TableCell key={id} />;
        }

        const customRender = renderFilterCell?.({ columnId: id, value, setValue });

        if (customRender) {
          return <TableCell key={id}>{customRender}</TableCell>;
        }

        // Default cell rendering
        return (
          <TableCell key={id}>
            <Input
              value={(value as string) ?? ''}
              onChange={e => setValue(e.target.value)}
              className="h-7 w-full"
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
}
