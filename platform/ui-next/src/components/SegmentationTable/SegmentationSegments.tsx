import React from 'react';
import { ScrollArea, DataRow } from '../../components';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const SegmentationSegments: React.FC<{ segmentationId?: string }> = ({ segmentationId }) => {
  const {
    activeSegmentationId,
    disableEditing,
    onSegmentColorClick,
    onToggleSegmentVisibility,
    onToggleSegmentLock,
    onSegmentClick,
    onSegmentEdit,
    onSegmentDelete,
    data,
  } = useSegmentationTableContext('SegmentationTable.Segments');

  const segmentationIdToUse = segmentationId ? segmentationId : activeSegmentationId;
  const entry = data.find(seg => seg.segmentation.segmentationId === segmentationIdToUse);

  const segmentation = entry?.segmentation;
  const representation = entry?.representation;

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <ScrollArea
      className="ohif-scrollbar invisible-scrollbar bg-bkg-low h-[600px] space-y-px"
      showArrows={true}
    >
      {Object.values(representation.segments).map(segment => {
        if (!segment) {
          return null;
        }
        const { segmentIndex, color, visible } = segment;
        const segmentFromSegmentation = segmentation.segments[segmentIndex];

        const { locked, active, label } = segmentFromSegmentation;
        const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

        return (
          <DataRow
            key={segmentIndex}
            number={segmentIndex}
            title={label}
            description=""
            colorHex={cssColor}
            isSelected={active}
            isVisible={visible}
            isLocked={locked}
            disableEditing={disableEditing}
            onColor={() => onSegmentColorClick(activeSegmentationId, segmentIndex)}
            onToggleVisibility={() => onToggleSegmentVisibility(activeSegmentationId, segmentIndex)}
            onToggleLocked={() => onToggleSegmentLock(activeSegmentationId, segmentIndex)}
            onSelect={() => onSegmentClick(activeSegmentationId, segmentIndex)}
            onRename={() => onSegmentEdit(activeSegmentationId, segmentIndex)}
            onDelete={() => onSegmentDelete(activeSegmentationId, segmentIndex)}
          />
        );
      })}
    </ScrollArea>
  );
};
