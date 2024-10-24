import React from 'react';
import { ScrollArea, DataRow } from '../../components';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const SegmentationSegments: React.FC<{
  segmentation?: unknown;
  representation?: unknown;
}> = ({ segmentation, representation }) => {
  const {
    activeSegmentationId,
    disableEditing,
    onSegmentColorClick,
    onToggleSegmentVisibility,
    onToggleSegmentLock,
    onSegmentClick,
    mode,
    onSegmentEdit,
    onSegmentDelete,
    data,
  } = useSegmentationTableContext('SegmentationTable.Segments');

  let segmentationToUse = segmentation;
  let representationToUse = representation;
  let segmentationIdToUse = activeSegmentationId;
  if (!segmentationToUse || !representationToUse) {
    const entry = data.find(seg => seg.segmentation.segmentationId === activeSegmentationId);
    segmentationToUse = entry?.segmentation;
    representationToUse = entry?.representation;
    segmentationIdToUse = entry?.segmentation.segmentationId;
  }

  if (!representationToUse || !segmentationToUse) {
    return null;
  }

  const segmentCount = Object.keys(representationToUse.segments).length;
  const height = mode === 'collapsed' ? 'h-[600px]' : `h-[${segmentCount * 200}px]`;

  return (
    <ScrollArea
      className={`ohif-scrollbar invisible-scrollbar bg-bkg-low space-y-px ${height}`}
      showArrows={true}
    >
      {Object.values(representationToUse.segments).map(segment => {
        if (!segment) {
          return null;
        }
        const { segmentIndex, color, visible } = segment;
        const segmentFromSegmentation = segmentationToUse.segments[segmentIndex];

        if (!segmentFromSegmentation) {
          return null;
        }

        const { locked, active, label, displayText } = segmentFromSegmentation;
        const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

        return (
          <DataRow
            key={segmentIndex}
            number={segmentIndex}
            title={label}
            details={displayText}
            colorHex={cssColor}
            isSelected={active}
            isVisible={visible}
            isLocked={locked}
            disableEditing={disableEditing}
            onColor={() => onSegmentColorClick(segmentationIdToUse, segmentIndex)}
            onToggleVisibility={() =>
              onToggleSegmentVisibility(segmentationIdToUse, segmentIndex, representationToUse.type)
            }
            onToggleLocked={() => onToggleSegmentLock(segmentationIdToUse, segmentIndex)}
            onSelect={() => onSegmentClick(segmentationIdToUse, segmentIndex)}
            onRename={() => onSegmentEdit(segmentationIdToUse, segmentIndex)}
            onDelete={() => onSegmentDelete(segmentationIdToUse, segmentIndex)}
          />
        );
      })}
    </ScrollArea>
  );
};
