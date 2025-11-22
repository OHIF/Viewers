import * as React from 'react'
import { TableRow, TableCell } from '../Table'
import { Input } from '../Input'
import { Button } from '../Button'

import { useDataTable } from './context'

type Props<TData> = {
  excludeColumnIds?: string[]
  resetCellId?: string
  onReset?: () => void
  renderCell?: (opts: { columnId: string; value: unknown; setValue: (v: unknown) => void }) => React.ReactNode
  inputClassName?: string
}

export function DataTableFilterRow<TData>({
  excludeColumnIds = [],
  resetCellId,
  onReset,
  renderCell,
  inputClassName = 'h-7 w-full',
}: Props<TData>) {
  const { table } = useDataTable<TData>()
  const cols = table.getVisibleLeafColumns()
  return (
    <TableRow data-filter-row className="hover:bg-transparent">
      {cols.map((col) => {
        const id = col.id
        const value = table.getColumn(id)?.getFilterValue()
        const setValue = (v: unknown) => table.getColumn(id)?.setFilterValue(v)

        if (resetCellId && id === resetCellId) {
          return (
            <TableCell key={id} className="text-right">
              <Button variant="ghost" size="sm" onClick={onReset} aria-label="Reset filters">
                Reset
              </Button>
            </TableCell>
          )
        }

        if (excludeColumnIds.includes(id)) {
          return <TableCell key={id} />
        }

        return (
          <TableCell key={id}>
            {renderCell ? (
              renderCell({ columnId: id, value, setValue })
            ) : (
              <Input value={(value as string) ?? ''} onChange={(e) => setValue(e.target.value)} className={inputClassName} />
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
