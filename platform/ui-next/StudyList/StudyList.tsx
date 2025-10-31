import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { StudyRow } from './StudyListTypes';
import type { WorkflowId } from './WorkflowsInfer';
import { DefaultStudyList } from './recipes/DefaultStudyList';

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
 * Backwards-compatible facade that renders the default Study List recipe.
 * Consumers who want more control can import headless primitives directly.
 */
export function StudyList(props: Props) {
  return <DefaultStudyList {...props} />;
}
