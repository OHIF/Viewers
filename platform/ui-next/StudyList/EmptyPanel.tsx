import * as React from 'react';
import { Summary } from '../playground/studylist/panels/panel-summary';
import type { WorkflowId } from './WorkflowsInfer';

export function EmptyPanel({
  defaultMode,
  onDefaultModeChange,
}: {
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  return (
    <Summary.Root>
      <Summary.Patient />
      {/* Casting to any since panel-summary is prototype-only and untyped */}
      <Summary.Workflows
        defaultMode={defaultMode as any}
        onDefaultModeChange={onDefaultModeChange as any}
      />
    </Summary.Root>
  );
}