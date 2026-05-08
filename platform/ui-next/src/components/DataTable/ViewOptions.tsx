import * as React from 'react';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '../DropdownMenu';
import { Icons } from '../Icons';

import { useDataTable } from './context';
import type { ColumnMeta } from './types';

type ViewOptionsProps = {
  buttonText?: string;
};

export function ViewOptions<TData>({ buttonText = 'View' }: ViewOptionsProps) {
  const { table } = useDataTable<TData>();
  const columns = table.getAllColumns().filter(c => c.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-sm"
        >
          {buttonText}
          <Icons.ChevronDown className="h-2 w-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map(column => {
          const meta = (column.columnDef.meta as ColumnMeta | undefined) ?? undefined;
          const label = meta?.label ?? column.id;
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={v => column.toggleVisibility(!!v)}
              className="capitalize"
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
