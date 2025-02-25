import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext } from './SegmentationTableContext';

/**
 * Props interface for the AddSegmentRow component
 */
interface AddSegmentRowProps {
  /** Optional child elements to render within the row */
  children?: React.ReactNode;
  /** Optional segmentation object to override the active segmentation */
  segmentation?: unknown;
}

/**
 * A component that renders a row with controls for adding segments and toggling visibility
 * in the segmentation table.
 *
 * @param props - Component properties
 * @param props.children - Optional child elements to render within the row
 * @param props.segmentation - Optional segmentation object to override the active segmentation
 */
export const AddSegmentRow: React.FC<AddSegmentRowProps> = ({ children = null, segmentation }) => {
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
      <div className="flex-1">
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
      </div>
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
