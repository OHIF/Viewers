import React, { useEffect } from 'react';
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
  let segmentation;
  let representation;

  const activeSegmentRef = React.useRef<{
    element: HTMLElement | null;
    index: number | null;
  }>({ element: null, index: null });

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

  const segments = Object.values(representation.segments);

  // Find the active segment to scroll to it when it changes
  const activeSegment = segments.find(segment => {
    if (!segment) {
      return false;
    }
    const segmentFromSegmentation = segmentation.segments[segment.segmentIndex];
    return segmentFromSegmentation?.active;
  });

  const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;

  const { ref: scrollableContainerRef, maxHeight } = useDynamicMaxHeight(segments);

  useEffect(() => {
    const activeSegmentIndex = activeSegmentRef.current.index;
    if (!activeSegmentIndex || activeSegmentIndex !== activeSegment?.segmentIndex) {
      return;
    }

    const activeSegmentElement = activeSegmentRef.current.element;

    if (!activeSegmentElement) {
      return;
    }

    // Check if the active segment is already visible.
    const activeSegmentElementBounds = activeSegmentElement.getBoundingClientRect();
    const scrollableContainerRect = scrollableContainerRef.current.getBoundingClientRect();
    if (
      activeSegmentElementBounds.top > scrollableContainerRect.top &&
      activeSegmentElementBounds.bottom < scrollableContainerRect.bottom
    ) {
      // The active segment is already visible, so we don't need to scroll.
      return;
    }

    activeSegmentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSegment?.segmentIndex, scrollableContainerRef]);

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <div ref={scrollableContainerRef}>
      <ScrollArea
        className={`bg-bkg-low space-y-px`}
        showArrows={
          scrollableContainerRef?.current
            ? scrollableContainerRef?.current?.offsetHeight >= parseFloat(maxHeight)
            : false
        }
      >
        <div style={{ maxHeight: maxHeight }}>
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

            // Secondary selection: segment is active, but its parent segmentation is inactive
            const isSecondarySelected = active && !isActiveSegmentation;

            const hasStats = segmentFromSegmentation.cachedStats?.namedStats;

            const segmentRowRef = (element: HTMLElement) => {
              if (!active) {
                return;
              }

              if (element) {
                activeSegmentRef.current = { element, index: segmentIndex };
              } else {
                activeSegmentRef.current = { element: null, index: null };
              }
            };

            const DataRowComponent = (
              <DataRow
                ref={segmentRowRef}
                key={segmentIndex}
                number={showSegmentIndex ? segmentIndex : null}
                title={label}
                // details={displayText}
                description={displayText}
                colorHex={cssColor}
                // Primary selection only when part of the active segmentation
                isSelected={active && isActiveSegmentation}
                // Secondary selection tint when selected in an inactive segmentation
                isSecondarySelected={isSecondarySelected}
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
    </div>
  );
};

SegmentationSegments.displayName = 'SegmentationTable.Segments';
