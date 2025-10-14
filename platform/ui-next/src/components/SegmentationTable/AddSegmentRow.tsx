import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext, useSegmentationExpanded } from './contexts';

export const AddSegmentRow: React.FC<{ children?: React.ReactNode }> = ({ children = null }) => {
  const {
    activeRepresentation,
    disableEditing,
    activeSegmentationId,
    onSegmentAdd,
    onToggleSegmentationRepresentationVisibility,
    data,
    showAddSegment,
  } = useSegmentationTableContext('AddSegmentRow');

  // Try to get from expanded context first, then fall back to active segmentation
  let segmentationId = activeSegmentationId;
  let representation = activeRepresentation;

  try {
    const expandedContext = useSegmentationExpanded('AddSegmentRow');
    if (expandedContext.isActive) {
      segmentationId = expandedContext.segmentation.segmentationId;
      representation = expandedContext.representation;
    }
  } catch (e) {
    // Use the default values from table context
  }

  // If no segmentations, don't render
  if (!data?.length) {
    return null;
  }

  // Check if all segments are visible
  const allSegmentsVisible = Object.values(representation?.segments || {}).every(
    segment => segment?.visible !== false
  );

  const Icon = allSegmentsVisible ? (
    <Icons.Hide className="h-6 w-6" />
  ) : (
    <Icons.Show className="h-6 w-6" />
  );

  const allowAddSegment = showAddSegment && !disableEditing;

  return (
    <div className="my-px flex h-7 w-full items-center justify-between rounded pl-0.5 pr-7">
      <div className="mt-1 flex-1">
        {allowAddSegment ? (
          <Button
            size="sm"
            variant="ghost"
            className="pr pl-0.5"
            onClick={() => onSegmentAdd(segmentationId)}
          >
            <Icons.Add />
            Add Segment
          </Button>
        ) : null}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() =>
          onToggleSegmentationRepresentationVisibility(segmentationId, representation?.type)
        }
      >
        {Icon}
      </Button>
      {children}
    </div>
  );
};
