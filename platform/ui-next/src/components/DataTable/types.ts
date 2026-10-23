import * as React from 'react';

/**
 * Metadata type for DataTable columns.
 * This type defines the structure of the `meta` property in TanStack Table column definitions.
 */
export type ColumnMeta = {
  /** Required label for the column (used by ViewOptions and as fallback for header) */
  label: string;
  /** Optional custom React node to render in the header instead of the label */
  headerContent?: React.ReactNode;
  /** Optional alignment for the column content */
  align?: 'left' | 'center' | 'right';
  /** Optional CSS class name for the header cell */
  headerClassName?: string;
  /** Optional CSS class name for the body cells in this column */
  cellClassName?: string;
  /** Optional minimum width for the column (can be a number or CSS string) */
  minWidth?: number | string;
  /**
   * Drop priority for responsive column visibility. Setting this opts the
   * column in to responsive dropping; columns without a priority are never
   * auto-hidden. Among opted-in columns, higher values are kept visible
   * longer when container width shrinks; lower values are dropped first.
   */
  priority?: number;
};
