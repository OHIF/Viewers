import * as React from 'react';
import type { Cell } from '@tanstack/react-table';
import { DataTable } from '../../DataTable';
import { StudyListWorkflowMenu } from './StudyListWorkflowMenu';
import type { StudyRow } from '../types/StudyListTypes';

export function StudyListActionsCell({ cell }: { cell: Cell<StudyRow, unknown> }) {
  const original = cell.row.original as StudyRow;

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
