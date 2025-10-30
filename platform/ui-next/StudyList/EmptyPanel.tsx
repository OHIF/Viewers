import * as React from 'react';
import { PatientSummary } from '../src/components/PatientSummary';
import type { WorkflowId } from './WorkflowsInfer';

export function EmptyPanel({
  defaultMode,
  onDefaultModeChange,
}: {
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  return (
    <PatientSummary.Root>
      <PatientSummary.Patient />
      <PatientSummary.Workflows<WorkflowId>
        defaultMode={defaultMode}
        onDefaultModeChange={onDefaultModeChange}
      />
    </PatientSummary.Root>
  );
}