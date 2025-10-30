import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../src/components/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../src/components/Select';
import { Label } from '../../../src/components/Label';
import { ALL_WORKFLOW_OPTIONS, type WorkflowId } from '../../../StudyList/WorkflowsInfer';
import { useDefaultWorkflow as useDefaultWorkflowDS } from '../../../StudyList/useDefaultWorkflow';

/** Keep the existing export name so playground imports remain unchanged */
export const WORKFLOW_OPTIONS = ALL_WORKFLOW_OPTIONS;
/** Alias to DS union to avoid churn in playground callers */
export type DefaultWorkflow = WorkflowId;

/**
 * Prototype wrapper around the DS hook to enforce the WorkflowId union and allowed list.
 * Keeps the same signature used by the playground.
 */
export function useDefaultWorkflow(storageKey = 'studylist.defaultWorkflow') {
  return useDefaultWorkflowDS<WorkflowId>(storageKey, ALL_WORKFLOW_OPTIONS);
}

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (value: WorkflowId | null) => void;
};

export function StudylistSettingsDialog({
  open,
  onOpenChange,
  defaultMode,
  onDefaultModeChange,
}: SettingsDialogProps) {
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