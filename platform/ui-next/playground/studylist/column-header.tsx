import * as React from 'react'
import { Button } from '../../src/components/Button'
import type { Column } from '@tanstack/react-table'

export function ColumnHeader<TData, TValue>({
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
  const justifyClass =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <div className={`flex items-center ${justifyClass} w-full gap-1`}>
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

