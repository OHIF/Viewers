import React from 'react';
import { ScrollArea, DataRow } from '../../components';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../components/HoverCard';
import { useSegmentationTableContext, useSegmentationExpanded } from './contexts';
import { SegmentStatistics } from './SegmentStatistics';
import { useDynamicMaxHeight } from '../../hooks/useDynamicMaxHeight';

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
    onSegmentCopy,
    data,
    showSegmentIndex = true,
  } = useSegmentationTableContext('SegmentationSegments');

  // Try to get segmentation data from expanded context first, then fall back to table context
  let segmentation: any;
  let representation: any;
  let isActiveFromContext = false;

  try {
    // Try to use the SegmentationExpanded context if available
    const segmentationInfo = useSegmentationExpanded('SegmentationSegments');
    segmentation = segmentationInfo.segmentation;
    representation = segmentationInfo.representation;
    isActiveFromContext = !!(segmentationInfo as any).isActive;
  } catch (e) {
    // Not within SegmentationExpanded context, get from active segmentation
    const segmentationInfo = data.find(
      entry => entry.segmentation.segmentationId === activeSegmentationId
    );
    segmentation = segmentationInfo?.segmentation;
    representation = segmentationInfo?.representation;
    isActiveFromContext = true; // if we fell back to the active segmentation, it is necessarily active
  }

  const segments = Object.values(representation.segments);
  // Compute activeness robustly even if we have the 'isActive' on the expanded context
  const isActiveSegmentation =
    isActiveFromContext || segmentation?.segmentationId === activeSegmentationId;

  const { ref: scrollableContainerRef, maxHeight } = useDynamicMaxHeight(segments);

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <ScrollArea
      className={`bg-bkg-low space-y-px`}
      showArrows={true}
    >
      <div
        ref={scrollableContainerRef}
        style={{ maxHeight: maxHeight }}
        // Named group for segmentation activeness; children rows react via group-data variants.
        className="group/seg"
        data-active={isActiveSegmentation}
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

          const hasStats = segmentFromSegmentation.cachedStats?.namedStats;
          const DataRowComponent = (
            <DataRow
              key={segmentIndex}
              number={showSegmentIndex ? segmentIndex : null}
              title={label}
              // details={displayText}
              description={displayText}
              colorHex={cssColor}
              // Only isSelected remains; parent group/seg controls active/inactive styling.
              isSelected={active}
              isVisible={visible}
              isLocked={locked}
              disableEditing={disableEditing}
              onColor={() => onSegmentColorClick(segmentation.segmentationId, segmentIndex)}
              onToggleVisibility={() =>
                onToggleSegmentVisibility(
                  segmentation.segmentationId,
                  segmentIndex,
                  representation.type
                )
              }
              onToggleLocked={() => onToggleSegmentLock(segmentation.segmentationId, segmentIndex)}
              onSelect={() => onSegmentClick(segmentation.segmentationId, segmentIndex)}
              onRename={() => onSegmentEdit(segmentation.segmentationId, segmentIndex)}
              onDelete={() => onSegmentDelete(segmentation.segmentationId, segmentIndex)}
              onCopy={
                onSegmentCopy
                  ? () => onSegmentCopy(segmentation.segmentationId, segmentIndex)
                  : undefined
              }
            />
          );

          return hasStats ? (
            <HoverCard
              key={`hover-${segmentIndex}`}
              openDelay={300}
            >
              <HoverCardTrigger asChild>
                <div>{DataRowComponent}</div>
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
          ) : (
            DataRowComponent
          );
        })}
      </div>
    </ScrollArea>
  );
};

SegmentationSegments.displayName = 'SegmentationTable.Segments';
