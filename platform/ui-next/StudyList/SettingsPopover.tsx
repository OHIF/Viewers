import * as React from 'react';
import { PopoverContent } from '../src/components/Popover/Popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../src/components/Select';
import { Label } from '../src/components/Label';
import { ALL_WORKFLOW_OPTIONS, type WorkflowId } from './WorkflowsInfer';

type Props = {
  /** Controlled open state from parent Popover */
  open: boolean;
  /** onOpenChange from parent Popover */
  onOpenChange: (open: boolean) => void;
  /** Selected default workflow */
  defaultMode: WorkflowId | null;
  /** Handler when default workflow changes */
  onDefaultModeChange: (value: WorkflowId | null) => void;
};

/**
 * SettingsPopover
 * Renders PopoverContent with the settings form.
 * Intended to be used inside a Popover with a PopoverTrigger.
 */
export function SettingsPopover({ open, onOpenChange, defaultMode, onDefaultModeChange }: Props) {
  const selectId = React.useId();

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className="w-[360px] p-4"
      // Prevents unwanted focus jumps when opening
      onOpenAutoFocus={e => e.preventDefault()}
    >
      <div className="mt-0 flex items-center gap-3">
        <Label htmlFor={selectId} className="whitespace-nowrap">
          Default Workflow
        </Label>
        <div className="min-w-0 flex-1">
          <Select
            value={defaultMode ?? undefined}
            onValueChange={(value) => {
              onDefaultModeChange(value as WorkflowId);
              // Close the popover after selection for a snappier UX.
              onOpenChange(false);
            }}
          >
            <SelectTrigger id={selectId} className="w-full">
              <SelectValue placeholder="Select Default Workflow" />
            </SelectTrigger>
            {/* Keep stopPropagation so the Select's portal doesn't trigger outside interactions on the Popover */}
            <SelectContent onPointerDown={(e) => e.stopPropagation()}>
              {ALL_WORKFLOW_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </PopoverContent>
  );
}
