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

export const WORKFLOW_OPTIONS = [
  'Basic Viewer',
  'Segmentation',
  'TMTV Workflow',
  'US Workflow',
  'Preclinical 4D',
] as const;

export type DefaultWorkflow = typeof WORKFLOW_OPTIONS[number];

export function useDefaultWorkflow(storageKey = 'studylist.defaultWorkflow') {
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) setValue(raw);
      }
    } catch {}
  }, [storageKey]);

  const setAndPersist = React.useCallback(
    (next: string | null) => {
      setValue(next);
      try {
        if (typeof window !== 'undefined') {
          if (next == null) {
            window.localStorage.removeItem(storageKey);
          } else {
            window.localStorage.setItem(storageKey, next);
          }
        }
      } catch {}
    },
    [storageKey]
  );

  return [value, setAndPersist] as const;
}

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode: string | null;
  onDefaultModeChange: (value: string | null) => void;
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
              onValueChange={(value) => onDefaultModeChange(value)}
            >
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue placeholder="Select Default Workflow" />
              </SelectTrigger>
              <SelectContent onPointerDown={(e) => e.stopPropagation()}>
                {WORKFLOW_OPTIONS.map((opt) => (
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