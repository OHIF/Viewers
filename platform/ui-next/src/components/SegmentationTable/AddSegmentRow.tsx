import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const AddSegmentRow: React.FC<{
  children?: React.ReactNode;
  segmentation?: unknown;
}> = ({ children = null, segmentation }) => {
  const {
    activeRepresentation,
    disableEditing,
    activeSegmentationId,
    onSegmentAdd,
    onToggleSegmentationRepresentationVisibility,
    data,
    showAddSegment,
  } = useSegmentationTableContext('SegmentationTable');

  const allSegmentsVisible = Object.values(activeRepresentation?.segments || {}).every(
    segment => segment?.visible !== false
  );

  const segmentationIdToUse = segmentation ? segmentation.segmentationId : activeSegmentationId;

  if (!data?.length) {
    return null;
  }

  const Icon = allSegmentsVisible ? (
    <Icons.Hide className="h-6 w-6" />
  ) : (
    <Icons.Show className="h-6 w-6" />
  );

  const allowAddSegment = showAddSegment && !disableEditing;

  return (
    <div className="bg-primary-dark my-px flex h-7 w-full items-center justify-between rounded pl-0.5 pr-7">
      {allowAddSegment ? (
        <Button
          size="sm"
          variant="ghost"
          className="pr pl-0.5"
          onClick={() => onSegmentAdd(segmentationIdToUse)}
        >
          <Icons.Add />
          Add Segment
        </Button>
      ) : null}
      <Button
        size="icon"
        variant="ghost"
        onClick={() =>
          onToggleSegmentationRepresentationVisibility(
            segmentationIdToUse,
            activeRepresentation?.type
          )
        }
      >
        {Icon}
      </Button>
      {children}
    </div>
  );
};
