import React from 'react';

interface ViewportGridProps {
  numRows: number;
  numCols: number;
  layoutType?: string;
  children: React.ReactNode[];
}

/**
 * A minimal top-level container that organizes multiple <ViewportPane>
 * children in a grid. Typically driven by a layout config.
 */
function ViewportGrid({
  numRows,
  numCols,
  layoutType,
  children
}: ViewportGridProps) {
  return (
    <div
      data-cy="viewport-grid"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

export { ViewportGrid };
