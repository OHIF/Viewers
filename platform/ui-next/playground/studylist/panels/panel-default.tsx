import React from 'react'
import { Table, TableHeader, TableRow, TableHead } from '../../../src/components/Table'
import { Button } from '../../../src/components/Button'

export function PanelDefault({
  layout,
  onToggleLayout,
}: {
  layout: 'right' | 'bottom'
  onToggleLayout: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Table noScroll>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-background sticky top-0 z-10 rounded-t-md">
              <div className="flex items-center justify-between">
                <span>Studies</span>
                <Button size="sm" variant="outline" onClick={onToggleLayout}>
                  {layout === 'right' ? 'Move to Bottom' : 'Move to Right'}
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      <div className="text-muted-foreground text-sm">Select a study</div>
    </div>
  )
}

