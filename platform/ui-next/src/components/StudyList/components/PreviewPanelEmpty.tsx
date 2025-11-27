import * as React from 'react';
import { PatientSummary } from '../../PatientSummary';
import type { WorkflowId } from '../WorkflowsInfer';
import { useStudyList } from '../headless/StudyListProvider';

export function PreviewPanelEmpty({
  defaultMode,
  onDefaultModeChange,
}: {
  defaultMode: WorkflowId | null;
  onDefaultModeChange: (v: WorkflowId | null) => void;
}) {
  const { launch, availableWorkflowsFor } = useStudyList<any, WorkflowId>();
  return (
    <PatientSummary>
      <PatientSummary.Patient />
      <PatientSummary.Workflows<WorkflowId>
        defaultMode={defaultMode}
        onDefaultModeChange={onDefaultModeChange}
        workflows={availableWorkflowsFor(null)}
        onLaunchWorkflow={(data, wf) => {
          if (data) launch(data, wf);
        }}
      />
    </PatientSummary>
  );
}
