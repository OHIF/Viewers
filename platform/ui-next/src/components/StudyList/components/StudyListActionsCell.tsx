import * as React from 'react';
import type { Cell } from '@tanstack/react-table';
import { DataTable } from '../../DataTable';
import { StudyListWorkflowMenu } from './StudyListWorkflowMenu';
import type { StudyRow } from '../StudyListTypes';

export function StudyListActionsCell<TData>({ cell }: { cell: Cell<TData, unknown> }) {
  const original = cell.row.original as TData & StudyRow;

  return (
    <DataTable.ActionOverlayCell cell={cell}>
      <DataTable.ActionOverlayCell.Value>
        <div />
      </DataTable.ActionOverlayCell.Value>
      <DataTable.ActionOverlayCell.Overlay>
        <div onClick={e => e.stopPropagation()}>
          <StudyListWorkflowMenu studyRow={original} />
        </div>
      </DataTable.ActionOverlayCell.Overlay>
    </DataTable.ActionOverlayCell>
  );
}
