import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const AddSegmentRow: React.FC<{ children?: React.ReactNode }> = ({ children = null }) => {
  const {
    activeRepresentation,
    disableEditing,
    activeSegmentationId,
    onSegmentAdd,
    onToggleSegmentationVisibility,
    data,
  } = useSegmentationTableContext('SegmentationTable');

  const allSegmentsVisible = Object.values(activeRepresentation?.segments || {}).every(
    segment => segment?.visible !== false
  );

  if (!data?.length) {
    return null;
  }

  const Icon = allSegmentsVisible ? (
    <Icons.Hide className="h-6 w-6" />
  ) : (
    <Icons.Show className="h-6 w-6" />
  );

  return (
    <div className="bg-primary-dark my-px flex h-9 w-full items-center justify-between rounded pl-0.5 pr-7">
      {disableEditing ? null : (
        <Button
          size="sm"
          variant="ghost"
          className="pr pl-0.5"
          onClick={() => onSegmentAdd(activeSegmentationId)}
        >
          <Icons.Add />
          Add Segment
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onToggleSegmentationVisibility(activeSegmentationId)}
      >
        {Icon}
      </Button>
      {children}
    </div>
  );
};
