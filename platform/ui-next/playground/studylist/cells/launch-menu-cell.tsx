import * as React from 'react'
import type { Row } from '@tanstack/react-table'
import { Button } from '../../../src/components/Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../src/components/DropdownMenu'

export function LaunchMenuCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const isActive = row.getIsSelected()
  return (
    <div className="relative">
      <div
        className={`text-right transition-opacity ${
          isActive
            ? 'invisible opacity-0'
            : 'group-hover:invisible group-hover:opacity-0 group-hover:text-transparent'
        }`}
      >
        {value}
      </div>
      <div
        className={`absolute inset-y-0 right-0 z-10 flex items-center px-2 ${
          isActive ? 'bg-popover opacity-100' : 'opacity-0 group-hover:bg-muted group-hover:opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          e.stopPropagation()
          if (!row.getIsSelected()) row.toggleSelected(true)
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (!row.getIsSelected()) row.toggleSelected(true)
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.stopPropagation()
                if (!row.getIsSelected()) row.toggleSelected(true)
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                if (!row.getIsSelected()) row.toggleSelected(true)
              }}
            >
              Open in...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Basic Viewer</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Segmentation</DropdownMenuItem>
            <DropdownMenuItem disabled>US Pleura B-line Annotations</DropdownMenuItem>
            <DropdownMenuItem disabled>Total Metabolic Tumor Volume</DropdownMenuItem>
            <DropdownMenuItem disabled>Microscopy</DropdownMenuItem>
            <DropdownMenuItem disabled>Preclinical 4D</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

