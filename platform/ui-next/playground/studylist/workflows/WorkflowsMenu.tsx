import * as React from 'react';
import { Button } from '../../../src/components/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../src/components/DropdownMenu';
import { getAvailableWorkflows } from './getAvailableWorkflows';
import type { WorkflowId } from '../../../StudyList/WorkflowsInfer';

type Props = {
  /** Optional explicit workflows; if omitted, `modalities` is used to infer. */
  workflows?: readonly (WorkflowId | string)[];
  modalities?: string;
  defaultMode?: WorkflowId | null;
  onLaunch?: (workflow: WorkflowId) => void;
  align?: 'start' | 'end' | 'center';
};

export function StudylistWorkflowsMenu({
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
        <Button size="sm" aria-expanded={open}>Open in...</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
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