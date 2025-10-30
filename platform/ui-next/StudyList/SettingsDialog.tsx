import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../src/components/Dialog';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (value: WorkflowId | null) => void;
};

export function SettingsDialog({ open, onOpenChange, defaultMode, onDefaultModeChange }: Props) {
  const selectId = React.useId();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none"
        style={{ width: 550, height: 350, maxWidth: 550, maxHeight: 350 }}
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex items-center gap-3">
          <Label htmlFor={selectId} className="whitespace-nowrap">
            Default Workflow
          </Label>
          <div className="min-w-0 flex-1">
            <Select
              value={defaultMode ?? undefined}
              onValueChange={(value) => onDefaultModeChange(value as WorkflowId)}
            >
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue placeholder="Select Default Workflow" />
              </SelectTrigger>
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
      </DialogContent>
    </Dialog>
  );
}