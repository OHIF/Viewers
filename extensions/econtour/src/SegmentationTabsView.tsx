import React, { useMemo } from 'react';
import { ScrollArea, DataRow } from '@ohif/ui-next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';
import { useSegmentationTableContext, useSegmentationExpanded } from '@ohif/ui-next';
import { useDynamicMaxHeight } from '@ohif/ui-next';

export const SegmentationTabsView = ({ children = null }: { children?: React.ReactNode }) => {
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

  const segments = Object.values(segmentation.segments);
  const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;

  // Group segments by their group property
  const groupedSegments = useMemo(() => {
    const grouped = new Map();
    const ungrouped = [];

    // Initialize with a "All" group that contains all segments
    grouped.set('All', []);

    segments.forEach(segment => {
      if (!segment) {
        return;
      }

      const { segmentIndex } = segment;
      const segmentFromSegmentation = segmentation.segments[segmentIndex];

      if (!segmentFromSegmentation) {
        return;
      }

      // Add to "All" group
      grouped.get('All').push({
        segment,
        segmentData: segmentFromSegmentation,
      });

      // Check if segment has a group property
      const group = segmentFromSegmentation.group;

      if (group) {
        // If group doesn't exist yet, create it
        if (!grouped.has(group)) {
          grouped.set(group, []);
        }

        // Add segment to its group
        grouped.get(group).push({
          segment,
          segmentData: segmentFromSegmentation,
        });
      } else {
        // Keep track of ungrouped segments
        ungrouped.push({
          segment,
          segmentData: segmentFromSegmentation,
        });
      }
    });

    // Add "Ungrouped" category if there are any ungrouped segments
    if (ungrouped.length > 0) {
      grouped.set('Ungrouped', ungrouped);
    }

    return grouped;
  }, [segments, segmentation]);

  // Get an array of group names for the tabs
  const groupNames = Array.from(groupedSegments.keys());
  console.debug('🚀 ~ groupNames:', groupNames);

  // Determine default tab to show - use the first group
  const defaultGroup = groupNames[0] || 'All';

  return (
    <Tabs defaultValue={defaultGroup} className="w-full">
      <TabsList className="mb-2 flex gap-1">
        {groupNames.map(groupName => (
          <TabsTrigger key={groupName} value={groupName} className="max-w-24 flex-1 truncate">
            {groupName}
          </TabsTrigger>
        ))}
      </TabsList>

      {groupNames.map(groupName => {
        const groupSegments = groupedSegments.get(groupName) || [];
        // Use dynamic height based on number of segments in this group
        const { ref: scrollableContainerRef, maxHeight } = useDynamicMaxHeight(groupSegments);

        return (
          <TabsContent key={groupName} value={groupName} className="mt-0">
            <ScrollArea className="bg-bkg-low space-y-px" showArrows={true}>
              <div ref={scrollableContainerRef} style={{ maxHeight }}>
                {groupSegments.map(({ segment, segmentData }) => {
                  const { segmentIndex, color, visible } = segment;
                  const { locked, active, label, displayText } = segmentData;
                  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

                  const DataRowComponent = (
                    <DataRow
                      key={segmentIndex}
                      number={showSegmentIndex ? segmentIndex : null}
                      title={label}
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
                  );

                  return DataRowComponent;
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

SegmentationTabsView.displayName = 'SegmentationTabsView';
