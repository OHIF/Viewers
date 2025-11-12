import * as React from 'react';
import { useDefaultWorkflow } from '../useDefaultWorkflow';
import {
  ALL_WORKFLOW_OPTIONS,
  getAvailableWorkflows,
  type WorkflowId,
} from './workflows-registry';

/**
 * Builds the headless state for the Study List.
 * Keeps selection, panel open state, default workflow, and a launch handler.
 */
export function useStudyListState<T = any, W extends string = WorkflowId>(
  rows: T[],
  {
    defaultWorkflowKey = 'studylist.defaultWorkflow',
    onLaunch,
  }: {
    defaultWorkflowKey?: string;
    onLaunch?: (row: T, wf: W) => void;
  } = {}
) {
  const [selected, setSelected] = React.useState<T | null>(null);
  const [isPanelOpen, setPanelOpen] = React.useState(true);
  const [defaultWorkflow, setDefaultWorkflow] = useDefaultWorkflow<W>(
    defaultWorkflowKey,
    ALL_WORKFLOW_OPTIONS as unknown as ReadonlyArray<W>
  );

  const launch = React.useCallback(
    (row: T, wf: W) => {
      onLaunch?.(row, wf);
    },
    [onLaunch]
  );

  return {
    rows,
    selected,
    setSelected,
    isPanelOpen,
    setPanelOpen,
    defaultWorkflow,
    setDefaultWorkflow,
    availableWorkflowsFor: (r: Partial<T> | null | undefined) =>
      getAvailableWorkflows((r ?? {}) as any) as readonly W[],
    launch,
  } as const;
}

