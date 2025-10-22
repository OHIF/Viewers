import React from 'react';
import { Table, TableHeader, TableRow, TableHead } from '../../../src/components/Table';

export function PanelDefault() {
  return (
    <div className="flex flex-col gap-1">
      <Table noScroll>
        <TableHeader className="border-0 [&_tr]:border-b-0">
          <TableRow className="border-b-0">
            <TableHead className="bg-background sticky top-0 z-10 rounded-t-md">
              <div className="flex items-center">
                <span className="text-foreground text-xl font-medium">Studies</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      <div className="text-muted-foreground pl-2 text-lg">Select a study to preview</div>
    </div>
  );
}
