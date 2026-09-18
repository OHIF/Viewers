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
import { useUnfitColumnIds, useToggleColumnVisibility } from './useResponsiveColumns';
import type { ColumnMeta } from './types';

type ViewOptionsProps = {
  buttonText?: string;
};

export function ViewOptions<TData>({ buttonText = 'View' }: ViewOptionsProps) {
  const { t } = useTranslation('DataTable');
  const { table } = useDataTable<TData>();
  const unfitColumnIds = useUnfitColumnIds();
  const toggleColumnVisibility = useToggleColumnVisibility();
  const columns = table.getAllColumns().filter(c => c.getCanHide());
  // Visibility is read from table.state — the reactive path — rather than
  // column.getIsVisible(): column objects are identity-stable across renders,
  // so a compiled read through their methods would freeze at mount. The
  // state object is replaced on every visibility change, so the compiler
  // re-derives everything below exactly when it should.
  const columnVisibility = table.state.columnVisibility;

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
          const isVisible = columnVisibility[column.id] !== false;
          const isUnfit = !isVisible && unfitColumnIds.has(column.id);
          const checkbox = (
            <DropdownMenuCheckboxItem
              checked={isVisible}
              disabled={isUnfit}
              // The funnel both records the toggle as a sticky user decision
              // and writes the table state. See useToggleColumnVisibility.
              onCheckedChange={v => toggleColumnVisibility(column.id, !!v)}
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
