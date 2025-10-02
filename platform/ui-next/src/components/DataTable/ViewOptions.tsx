import * as React from 'react'
import { Button } from '../Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '../DropdownMenu'

import { useDataTable } from './context'

type Props<TData> = {
  getLabel?: (columnId: string) => string
  canHide?: (columnId: string) => boolean
  buttonText?: string
}

export function DataTableViewOptions<TData>({
  getLabel = (id) => id,
  canHide = () => true,
  buttonText = 'Columns',
}: Props<TData>) {
  const { table } = useDataTable<TData>()
  const columns = table.getAllColumns().filter((c) => c.getCanHide() && canHide(c.id))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(v) => column.toggleVisibility(!!v)}
            className="capitalize"
          >
            {getLabel(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
