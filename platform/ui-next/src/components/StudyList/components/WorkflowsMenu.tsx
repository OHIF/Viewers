import * as React from 'react';
import { Button } from '../../Button';
import { Icons } from '../../Icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../DropdownMenu';
import { getAvailableWorkflows, type WorkflowId } from '../WorkflowsInfer';

type Props = {
  workflows?: readonly (WorkflowId | string)[];
  modalities?: string;
  defaultMode?: WorkflowId | null;
  onLaunch?: (workflow: WorkflowId) => void;
  align?: 'start' | 'end' | 'center';
};

export function WorkflowsMenu({
  workflows,
  modalities,
  defaultMode,
  onLaunch,
  align = 'end',
}: Props) {
  const [open, setOpen] = React.useState(false);
  const items = React.useMemo(
    () => getAvailableWorkflows({ workflows, modalities }),
    [workflows, modalities]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open workflows menu"
          className="mt-1 transition-opacity"
        >
          <Icons.More className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
        <div className="text-muted-foreground border-b border-input py-1 pl-1 pr-4 text-sm my-1.5 mx-1">
          Launch Workflow:
        </div>
        {items.map((wf) => {
          const isDefault = defaultMode != null && String(defaultMode) === String(wf);
          return (
            <DropdownMenuItem
              key={String(wf)}
              onSelect={(e) => {
                e.preventDefault();
                onLaunch?.(wf);
              }}
              className={isDefault ? 'font-semibold' : undefined}
              aria-current={isDefault ? 'true' : undefined}
            >
              {isDefault ? '✓ ' : null}
              {wf}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

