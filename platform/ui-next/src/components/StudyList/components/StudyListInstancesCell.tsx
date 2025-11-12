import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import { DataTableActionOverlayCell } from '../../DataTable';
import { WorkflowsMenu } from './WorkflowsMenu';
import { useStudyList } from '../headless/StudyListProvider';
import type { WorkflowId } from '../WorkflowsInfer';

export function StudyListInstancesCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const { defaultWorkflow, launch } = useStudyList<TData, WorkflowId>();
  const original = row.original as TData;

  const handleLaunch = React.useCallback(
    (wf: WorkflowId) => {
      launch(original, wf);
    },
    [launch, original]
  );

  return (
    <DataTableActionOverlayCell
      isActive={row.getIsSelected()}
      value={<div className="text-right">{value}</div>}
      overlayAlign="end"
      onActivate={() => {
        if (!row.getIsSelected()) row.toggleSelected(true);
      }}
      overlay={
        <div onClick={(e) => e.stopPropagation()}>
          <WorkflowsMenu
            workflows={(original as any).workflows}
            modalities={(original as any).modalities}
            defaultMode={defaultWorkflow}
            onLaunch={handleLaunch}
          />
        </div>
      }
    />
  );
}

