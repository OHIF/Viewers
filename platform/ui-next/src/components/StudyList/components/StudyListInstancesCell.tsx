import * as React from 'react';
import type { Cell } from '@tanstack/react-table';
import { DataTable } from '../../DataTable';
import { WorkflowsMenu } from './WorkflowsMenu';
import { useStudyList } from '../headless/StudyListProvider';
import type { WorkflowId } from '../WorkflowsInfer';

export function StudyListInstancesCell<TData>({ cell }: { cell: Cell<TData, unknown> }) {
  const { defaultWorkflow, launch } = useStudyList<TData, WorkflowId>();
  const original = cell.row.original as TData;
  const value = cell.getValue() as number;

  const handleLaunch = React.useCallback(
    (wf: WorkflowId) => {
      launch(original, wf);
    },
    [launch, original]
  );

  return (
    <DataTable.ActionOverlayCell cell={cell}>
      <DataTable.ActionOverlayCell.Value>
        <div className="text-right">{value}</div>
      </DataTable.ActionOverlayCell.Value>
      <DataTable.ActionOverlayCell.Overlay>
        <div onClick={e => e.stopPropagation()}>
          <WorkflowsMenu
            workflows={(original as any).workflows}
            modalities={(original as any).modalities}
            defaultMode={defaultWorkflow}
            onLaunch={handleLaunch}
          />
        </div>
      </DataTable.ActionOverlayCell.Overlay>
    </DataTable.ActionOverlayCell>
  );
}
