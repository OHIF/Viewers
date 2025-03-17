import React from 'react';
import { ScrollArea, DataRow } from '../../components';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../components/HoverCard';
import { useSegmentationTableContext, useSegmentationExpanded } from './contexts';
import { SegmentStatistics } from './SegmentStatistics';

export const SegmentationSegments = ({ children = null }: { children?: React.ReactNode }) => {
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
  } = useSegmentationTableContext('SegmentationSegments');

  // Try to get segmentation data from expanded context first, then fall back to table context
  let segmentation;
  let representation;

  try {
    // Try to use the SegmentationExpanded context if available
    const segmentationInfo = useSegmentationExpanded('SegmentationSegments');
    segmentation = segmentationInfo.segmentation;
    representation = segmentationInfo.representation;
  } catch (e) {
    // Not within SegmentationExpanded context, get from active segmentation
    const segmentationInfo = data.find(
      entry => entry.segmentation.segmentationId === activeSegmentationId
    );
    segmentation = segmentationInfo?.segmentation;
    representation = segmentationInfo?.representation;
  }

  if (!representation || !segmentation) {
    return null;
  }

  const segments = Object.values(representation.segments);
  const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;

  return (
    <ScrollArea
      className={`ohif-scrollbar invisible-scrollbar bg-bkg-low max-h-80 space-y-px`}
      showArrows={true}
    >
      {segments.map(segment => {
        if (!segment) {
          return null;
        }
        const { segmentIndex, color, visible } = segment as {
          segmentIndex: number;
          color: number[];
          visible: boolean;
        };
        const segmentFromSegmentation = segmentation.segments[segmentIndex];

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
              {/* The div here is not random, it is needed for making it work with the hover card */}
              <div>
                <DataRow
                  key={segmentIndex}
                  number={segmentIndex}
                  title={label}
                  details={displayText}
                  description={displayText}
                  colorHex={cssColor}
                  isSelected={active}
                  isVisible={visible}
                  isLocked={locked}
                  disableEditing={disableEditing}
                  className={!isActiveSegmentation ? 'opacity-80' : ''}
                  onColor={() => onSegmentColorClick(segmentation.segmentationId, segmentIndex)}
                  onToggleVisibility={() =>
                    onToggleSegmentVisibility(
                      segmentation.segmentationId,
                      segmentIndex,
                      representation.type
                    )
                  }
                  onToggleLocked={() =>
                    onToggleSegmentLock(segmentation.segmentationId, segmentIndex)
                  }
                  onSelect={() => onSegmentClick(segmentation.segmentationId, segmentIndex)}
                  onRename={() => onSegmentEdit(segmentation.segmentationId, segmentIndex)}
                  onDelete={() => onSegmentDelete(segmentation.segmentationId, segmentIndex)}
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
                <h3 className="text-muted-foreground break-words font-semibold">{label}</h3>
              </div>

              <SegmentStatistics
                segment={{
                  ...segmentFromSegmentation,
                  segmentIndex,
                }}
                segmentationId={segmentation.segmentationId}
              >
                {children}
              </SegmentStatistics>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </ScrollArea>
  );
};

SegmentationSegments.displayName = 'SegmentationTable.Segments';
