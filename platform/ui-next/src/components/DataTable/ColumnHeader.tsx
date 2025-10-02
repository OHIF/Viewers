import * as React from 'react'
import type { Column } from '@tanstack/react-table'
import { Button } from '../Button'

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = 'left',
}: {
  column: Column<TData, TValue>
  title: string
  align?: 'left' | 'center' | 'right'
}) {
  const sorted = column.getIsSorted() as false | 'asc' | 'desc'
  const indicator = sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <div className={`flex w-full items-center gap-1 ${justify}`}>
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
  )
}

