import * as React from 'react';
import { Button } from '../../Button';
import { Icons } from '../../Icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../DropdownMenu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../Tooltip';
import { useStudyListWorkflows } from './StudyListWorkflowProvider';
import type { StudyRow } from '../types/StudyListTypes';

type Props = {
  studyRow: StudyRow;
  align?: 'start' | 'end' | 'center';
};

export function StudyListWorkflowMenu({ studyRow, align = 'end' }: Props) {
  const [open, setOpen] = React.useState(false);
  const { getWorkflowsForStudy } = useStudyListWorkflows();
  const workflows = getWorkflowsForStudy(studyRow);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Action Menu"
                className="bg-primary/20 text-primary hover:bg-primary/30 mt-1 h-6 w-6 transition-opacity"
              >
                <Icons.More className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Action Menu</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        align={align}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-muted-foreground border-input my-1.5 mx-1 border-b py-1 pl-1 pr-4 text-sm">
          Launch Workflow:
        </div>
        {workflows.map(workflow => (
          <DropdownMenuItem
            key={workflow.id}
            onSelect={e => {
              e.preventDefault();
              workflow.launchWithStudy(studyRow);
            }}
            className={workflow.isDefault ? 'font-semibold' : undefined}
            aria-current={workflow.isDefault ? 'true' : undefined}
          >
            {workflow.isDefault ? '✓ ' : null}
            {workflow.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
