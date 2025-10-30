import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import { DataTableActionOverlayCell } from '../../../src/components/DataTable';
import { StudylistWorkflowsMenu } from '../workflows/WorkflowsMenu';
import { useStudylistTableContext } from '../components/studylist-table-context';
import type { WorkflowId } from '../../../StudyList/WorkflowsInfer';

export function LaunchMenuCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const { defaultMode, onLaunch } = useStudylistTableContext();

  const original: any = row.original ?? {};
  const handleLaunch = (wf: WorkflowId) => {
    onLaunch?.(original, wf);
  };

  return (
    <DataTableActionOverlayCell
      isActive={row.getIsSelected()}
      value={<div className="text-right">{value}</div>}
      onActivate={() => {
        if (!row.getIsSelected()) row.toggleSelected(true);
      }}
      overlay={
        <div onClick={(e) => e.stopPropagation()}>
          <StudylistWorkflowsMenu
            workflows={original.workflows}
            modalities={original.modalities}
            defaultMode={defaultMode}
            onLaunch={handleLaunch}
          />
        </div>
      }
    />
  );
}
