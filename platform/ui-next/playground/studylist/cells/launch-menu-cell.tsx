import * as React from 'react'
import type { Row } from '@tanstack/react-table'
import { Button } from '../../../src/components/Button'
import { DataTableActionOverlayCell } from '../../../src/components/DataTable'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../src/components/DropdownMenu'

export function LaunchMenuCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DataTableActionOverlayCell
      isActive={row.getIsSelected()}
      value={<div className="text-right">{value}</div>}
      onActivate={() => {
        if (!row.getIsSelected()) row.toggleSelected(true)
      }}
      overlay={
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" aria-expanded={open}>
              Open in...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Basic Viewer</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Segmentation</DropdownMenuItem>
            <DropdownMenuItem disabled>US Pleura B-line Annotations</DropdownMenuItem>
            <DropdownMenuItem disabled>Total Metabolic Tumor Volume</DropdownMenuItem>
            <DropdownMenuItem disabled>Microscopy</DropdownMenuItem>
            <DropdownMenuItem disabled>Preclinical 4D</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  )
}
