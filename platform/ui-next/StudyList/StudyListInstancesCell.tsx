import * as React from 'react';
import type { Row } from '@tanstack/react-table';
import { DataTableActionOverlayCell } from '../src/components/DataTable';
import { WorkflowsMenu } from './WorkflowsMenu';
import { useStudyListTableContext } from './TableContext';
import type { WorkflowId } from './WorkflowsInfer';

export function StudyListInstancesCell<TData>({ row, value }: { row: Row<TData>; value: number }) {
  const [open, setOpen] = React.useState(false);
  const { defaultMode, onLaunch } = useStudyListTableContext();
  const original: any = row.original ?? {};

  const handleLaunch = (wf: WorkflowId) => {
    onLaunch?.(original, wf);
    setOpen(false);
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
          <WorkflowsMenu
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