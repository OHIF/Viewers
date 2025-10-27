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

function getWorkflowsFromRow<TData>(row: Row<TData>): string[] {
  const defaults = ['Basic Viewer', 'Segmentation']
  const original: any = row.original ?? {}
  if (Array.isArray(original.workflows) && original.workflows.length > 0) {
    return Array.from(new Set(original.workflows))
  }
  const mod = String(original.modalities ?? '').toUpperCase()
  const flows = [...defaults]
  if (mod.includes('US')) flows.push('US Workflow')
  if (mod.includes('PET/CT') || (mod.includes('PET') && mod.includes('CT'))) flows.push('TMTV Workflow')
  return Array.from(new Set(flows))
}

export function LaunchMenuCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const [open, setOpen] = React.useState(false)
  const workflows = getWorkflowsFromRow(row)

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
            {workflows.map((wf) => (
              <DropdownMenuItem key={String(wf)} onSelect={(e) => e.preventDefault()}>
                {wf}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  )
}
