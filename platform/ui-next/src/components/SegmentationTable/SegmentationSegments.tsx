import React from 'react';
import { ScrollArea, DataRow } from '../../components';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../components/HoverCard';
import { useSegmentationTableContext } from './SegmentationTableContext';
import { SegmentStatistics } from './SegmentStatistics';

export const SegmentationSegments = ({ segmentation, representation, children }) => {
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

  // Find SegmentStatistics among children
  const findStatisticsComponent = children => {
    if (!children) {
      return null;
    }

    const childrenArray = React.Children.toArray(children);
    return childrenArray.find(
      child => child.type && child.type.displayName === 'SegmentationTable.SegmentStatistics'
    );
  };

  const statisticsComponent = findStatisticsComponent(children);
  return (
    <ScrollArea
      className={`ohif-scrollbar invisible-scrollbar bg-bkg-low h-[900px] space-y-px`}
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
          <HoverCard
            key={`hover-${segmentIndex}`}
            openDelay={300}
          >
            <HoverCardTrigger asChild>
              <div>
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
                    onToggleSegmentVisibility(
                      segmentationIdToUse,
                      segmentIndex,
                      representationToUse.type
                    )
                  }
                  onToggleLocked={() => onToggleSegmentLock(segmentationIdToUse, segmentIndex)}
                  onSelect={() => onSegmentClick(segmentationIdToUse, segmentIndex)}
                  onRename={() => onSegmentEdit(segmentationIdToUse, segmentIndex)}
                  onDelete={() => onSegmentDelete(segmentationIdToUse, segmentIndex)}
                />
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              align="start"
              className="w-72 border"
            >
              <div className="mb-4 flex items-center space-x-2">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: cssColor }}
                ></div>
                <h3 className="text-muted-foreground break-words text-lg font-semibold">{label}</h3>
              </div>

              {/* Use the statistics component */}
              <SegmentStatistics segment={segmentFromSegmentation}>
                {statisticsComponent ? statisticsComponent.props.children : null}
              </SegmentStatistics>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </ScrollArea>
  );
};

SegmentationSegments.displayName = 'SegmentationTable.Segments';
