import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { StudyRow } from './StudyListTypes';
import type { WorkflowId } from './WorkflowsInfer';
import { StudyListLargeLayout } from './layouts/StudyListLargeLayout';

type Props = {
  data: StudyRow[];
  columns?: ColumnDef<StudyRow, unknown>[];
  title?: React.ReactNode;
  getRowId?: (row: StudyRow, index: number) => string;
  enforceSingleSelection?: boolean;
  showColumnVisibility?: boolean;
  tableClassName?: string;
  onLaunch?: (study: StudyRow, workflow: WorkflowId) => void;
};

/**
 * Backwards-compatible facade that renders the default Study List layout.
 * Consumers who want more control can import headless primitives (or specific layouts) directly.
 * Future: this becomes a responsive wrapper that selects an appropriate layout (e.g., Large/Medium/Small).
 */
export function StudyList(props: Props) {
  // Temporary façade: renders LargeLayout until a responsive wrapper is introduced.
  return <StudyListLargeLayout {...props} />;
}
