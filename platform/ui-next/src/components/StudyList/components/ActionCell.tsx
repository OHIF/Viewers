import * as React from 'react';
import type { Cell } from '@tanstack/react-table';
import { DataTable } from '../../DataTable';
import { WorkflowMenu } from './WorkflowMenu';
import type { StudyRow } from '../types/types';

export function ActionCell({ cell }: { cell: Cell<StudyRow, unknown> }) {
  const original = cell.row.original as StudyRow;

  return (
    <DataTable.ActionOverlayCell cell={cell}>
      <DataTable.ActionOverlayCell.Overlay>
        <div onClick={e => e.stopPropagation()}>
          <WorkflowMenu studyRow={original} />
        </div>
      </DataTable.ActionOverlayCell.Overlay>
    </DataTable.ActionOverlayCell>
  );
}
