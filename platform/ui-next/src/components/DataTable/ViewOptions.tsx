import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '../DropdownMenu';
import { Icons } from '../Icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

import { useDataTable } from './context';
import { useUnfitColumnIds } from './useResponsiveColumns';
import type { ColumnMeta } from './types';

type ViewOptionsProps = {
  buttonText?: string;
};

export function ViewOptions<TData>({ buttonText = 'View' }: ViewOptionsProps) {
  const { t } = useTranslation('DataTable');
  const { table } = useDataTable<TData>();
  const unfitColumnIds = useUnfitColumnIds();
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
          const isUnfit = !column.getIsVisible() && unfitColumnIds.has(column.id);
          const checkbox = (
            <DropdownMenuCheckboxItem
              checked={column.getIsVisible()}
              disabled={isUnfit}
              onCheckedChange={v => column.toggleVisibility(!!v)}
              className="capitalize"
            >
              {label}
            </DropdownMenuCheckboxItem>
          );

          // Radix tooltips don't fire on a disabled descendant (no pointer
          // events). Wrap in a span — matching the ToolButton pattern in this
          // package — so the trigger element itself is enabled.
          if (isUnfit) {
            return (
              <Tooltip key={column.id}>
                <TooltipTrigger asChild>
                  <span>{checkbox}</span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {t('Not enough room to display this column')}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={column.id}>{checkbox}</React.Fragment>;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
