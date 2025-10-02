import * as React from 'react'
import type { Column } from '@tanstack/react-table'
import { Button } from '../Button'
import * as ReactNS from 'react'
import { DataTableContext } from './context'

export function DataTableColumnHeader<TData, TValue>({
  column,
  columnId,
  title,
  align = 'left',
}: {
  column?: Column<TData, TValue>
  columnId?: string
  title: string
  align?: 'left' | 'center' | 'right'
}) {
  const ctx = ReactNS.useContext(DataTableContext)
  const resolvedColumn = column ?? (columnId && ctx ? (ctx.table.getColumn(columnId) as Column<TData, TValue>) : undefined)
  if (!resolvedColumn) {
    return <span>{title}</span>
  }
  const sorted = resolvedColumn.getIsSorted() as false | 'asc' | 'desc'
  const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <div className={`flex w-full items-center gap-1 ${justify}`}>
      <span>{title}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => resolvedColumn.toggleSorting(sorted === 'asc')}
        aria-label={`Sort ${title}`}
        className="px-1"
      >
        {indicator}
      </Button>
    </div>
  )
}
