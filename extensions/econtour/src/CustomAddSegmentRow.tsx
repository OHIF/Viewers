import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext, useSegmentationExpanded } from '@ohif/ui-next';
import { useGroupTabs } from './GroupTabsView';

// This is a custom version of AddSegmentRow that is aware of the active group
export const CustomAddSegmentRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const {
    activeRepresentation,
    disableEditing,
    activeSegmentationId,
    onSegmentAdd,
    onToggleSegmentationRepresentationVisibility,
    data,
    showAddSegment,
  } = useSegmentationTableContext('CustomAddSegmentRow');

  // Try to get from expanded context first, then fall back to active segmentation
  let segmentationId = activeSegmentationId;
  let representation = activeRepresentation;

  const groupTabsContext = useGroupTabs();
  const activeGroup = groupTabsContext.activeGroup;

  try {
    const expandedContext = useSegmentationExpanded('CustomAddSegmentRow');
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

  // Find the segmentation info
  const segmentationInfo = data.find(entry => entry.segmentation.segmentationId === segmentationId);

  // Determine if all segments in the active group are visible
  let allSegmentsVisible = true; // Default to visible

  if (segmentationInfo && activeGroup) {
    const { segmentation } = segmentationInfo;
    const segments = Object.values(segmentation.segments);

    // Get all segments from the active group
    const groupSegments = segments.filter(segment => segment && segment.group === activeGroup);

    if (groupSegments.length > 0) {
      // Check if all segments in this group are visible
      allSegmentsVisible = groupSegments.every(segment => {
        const segmentIndex = segment.segmentIndex;
        const representationSegment = representation.segments[segmentIndex];
        return representationSegment?.visible !== false;
      });
    }
  } else if (representation) {
    // Fallback to checking all segments if no active group
    allSegmentsVisible = Object.values(representation.segments || {}).every(
      segment => segment?.visible !== false
    );
  }
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
          onToggleSegmentationRepresentationVisibility(
            segmentationId,
            representation?.type,
            activeGroup
          )
        }
      >
        {Icon}
      </Button>
      {children}
    </div>
  );
};
