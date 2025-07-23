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
    data,
    showSegmentIndex = true,
  } = useSegmentationTableContext('SegmentationSegments');

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

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

  const segments = Object.values(representation.segments);
  const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;

  const { ref: scrollableContainerRef, maxHeight } = useDynamicMaxHeight(segments);

  // Find the active segment to scroll to it when it changes
  const activeSegment = segments.find(segment => {
    if (!segment) return false;
    const segmentFromSegmentation = segmentation.segments[segment.segmentIndex];
    return segmentFromSegmentation?.active;
  });

  // Scroll to active segment when it changes
  React.useEffect(() => {
    if (activeSegment && isActiveSegmentation && scrollAreaRef.current) {
      const segmentElement = scrollAreaRef.current.querySelector(
        `[data-segment-index="${activeSegment.segmentIndex}"]`
      );
      
      if (segmentElement) {
        // Check if the element is already visible
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = segmentElement.getBoundingClientRect();
          
          // Check if element is outside the visible area
          const isAboveView = elementRect.top < containerRect.top;
          const isBelowView = elementRect.bottom > containerRect.bottom;
          
          if (isAboveView || isBelowView) {
            segmentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      }
    }
  }, [activeSegment?.segmentIndex, isActiveSegmentation]);

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className={`bg-bkg-low space-y-px`}
      showArrows={true}
    >
      <div
        ref={scrollableContainerRef}
        style={{ maxHeight: maxHeight }}
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
            <div
              key={segmentIndex}
              data-segment-index={segmentIndex}
            >
              <DataRow
                number={showSegmentIndex ? segmentIndex : null}
                title={label}
                // details={displayText}
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
                onToggleLocked={() => onToggleSegmentLock(segmentation.segmentationId, segmentIndex)}
                onSelect={() => onSegmentClick(segmentation.segmentationId, segmentIndex)}
                onRename={() => onSegmentEdit(segmentation.segmentationId, segmentIndex)}
                onDelete={() => onSegmentDelete(segmentation.segmentationId, segmentIndex)}
              />
            </div>
          );

          return hasStats ? (
            <div
              key={`hover-${segmentIndex}`}
              data-segment-index={segmentIndex}
            >
              <HoverCard
                openDelay={300}
              >
                <HoverCardTrigger asChild>
                  <div>
                    <DataRow
                      number={showSegmentIndex ? segmentIndex : null}
                      title={label}
                      // details={displayText}
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
                      onToggleLocked={() => onToggleSegmentLock(segmentation.segmentationId, segmentIndex)}
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
            </div>
          ) : (
            DataRowComponent
          );
        })}
      </div>
    </ScrollArea>
  );
};

SegmentationSegments.displayName = 'SegmentationTable.Segments';
