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
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const segmentRefsMap = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const userClickedRef = React.useRef<boolean>(false);

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

  // Scroll to active segment when it changes (only for programmatic activation, not user clicks)
  React.useEffect(() => {
    // Only auto-scroll if this wasn't triggered by a user click in the panel
    if (activeSegment && isActiveSegmentation && !userClickedRef.current && viewportRef.current) {
      const segmentElement = segmentRefsMap.current.get(activeSegment.segmentIndex);
      
      if (segmentElement) {
        const scrollContainer = viewportRef.current;
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = segmentElement.getBoundingClientRect();
        
        // Check if element is outside the visible area
        const isAboveView = elementRect.top < containerRect.top;
        const isBelowView = elementRect.bottom > containerRect.bottom;
        
        if (isAboveView || isBelowView) {
          // Use more controlled scroll behavior
          const elementTop = segmentElement.offsetTop;
          const containerHeight = scrollContainer.clientHeight;
          const elementHeight = segmentElement.clientHeight;
          
          // Calculate scroll position to center element, with proper bounds checking
          const targetScrollTop = Math.max(0, 
            Math.min(
              elementTop - (containerHeight - elementHeight) / 2,
              scrollContainer.scrollHeight - containerHeight
            )
          );
          
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }
    
    // Reset the user click flag after processing
    userClickedRef.current = false;
  }, [activeSegment, isActiveSegmentation]);

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <div
      ref={scrollableContainerRef}
      style={{ maxHeight: maxHeight }}
      className="relative"
    >
      <ScrollArea
        ref={scrollAreaRef}
        viewportRef={viewportRef}
        className={`bg-bkg-low space-y-px h-full`}
        showArrows={true}
      >
        <div className="space-y-px">
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
          
          // Common DataRow props to avoid duplication
          const dataRowProps = {
            number: showSegmentIndex ? segmentIndex : null,
            title: label,
            description: displayText,
            colorHex: cssColor,
            isSelected: active,
            isVisible: visible,
            isLocked: locked,
            disableEditing: disableEditing,
            className: !isActiveSegmentation ? 'opacity-80' : '',
            onColor: () => onSegmentColorClick(segmentation.segmentationId, segmentIndex),
            onToggleVisibility: () =>
              onToggleSegmentVisibility(
                segmentation.segmentationId,
                segmentIndex,
                representation.type
              ),
            onToggleLocked: () => onToggleSegmentLock(segmentation.segmentationId, segmentIndex),
            onSelect: () => {
              userClickedRef.current = true; // Mark as user-initiated
              onSegmentClick(segmentation.segmentationId, segmentIndex);
            },
            onRename: () => onSegmentEdit(segmentation.segmentationId, segmentIndex),
            onDelete: () => onSegmentDelete(segmentation.segmentationId, segmentIndex),
          };
          
          // Function to set segment ref
          const setSegmentRef = (element: HTMLDivElement | null) => {
            if (element) {
              segmentRefsMap.current.set(segmentIndex, element);
            } else {
              segmentRefsMap.current.delete(segmentIndex);
            }
          };

          const DataRowComponent = (
            <div
              key={segmentIndex}
              ref={setSegmentRef}
            >
              <DataRow {...dataRowProps} />
            </div>
          );

          return hasStats ? (
            <HoverCard
              key={`hover-${segmentIndex}`}
              openDelay={300}
            >
              <HoverCardTrigger asChild>
                <div ref={setSegmentRef}>
                  <DataRow {...dataRowProps} />
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
