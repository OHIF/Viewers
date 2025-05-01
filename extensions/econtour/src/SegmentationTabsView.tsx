import React, { useMemo } from 'react';
import { ScrollArea, DataRow } from '@ohif/ui-next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';
import { useSegmentationTableContext, useSegmentationExpanded } from '@ohif/ui-next';
import { useDynamicMaxHeight } from '@ohif/ui-next';
import { useGroupTabs } from './GroupTabsView';

// Main component
const SegmentationTabsView = ({ children = null }: { children?: React.ReactNode }) => {
  const {
    activeSegmentationId,
    disableEditing,
    onSegmentColorClick,
    onToggleSegmentVisibility,
    onToggleSegmentLock,
    onSegmentClick,
    onSegmentEdit,
    onSegmentDelete,
    showSegmentIndex = true,
  } = useSegmentationTableContext('SegmentationSegments');

  const segmentationInfo = useSegmentationExpanded('SegmentationSegments');
  const segmentation = segmentationInfo.segmentation;
  const representation = segmentationInfo.representation;

  const segments = Object.values(segmentation.segments);
  const isActiveSegmentation = segmentation.segmentationId === activeSegmentationId;

  // Group segments by their group property
  const groupedSegments = useMemo(() => {
    const grouped = new Map();

    segments.forEach(segment => {
      if (!segment) {
        return;
      }

      const { segmentIndex, group } = segment;
      const segmentFromSegmentation = segmentation.segments[segmentIndex];
      const representationSegment = representation.segments[segmentIndex];

      if (!segmentFromSegmentation) {
        return;
      }

      let segmentGroup = grouped.get(group);
      if (!segmentGroup) {
        grouped.set(group, []);
      }

      segmentGroup = grouped.get(group);

      // Add to "All" group
      segmentGroup.push({
        segment,
        segmentData: {
          ...segmentFromSegmentation,
          ...representationSegment,
        },
      });
    });

    return grouped;
  }, [segments, segmentation]);

  // Get an array of group names for the tabs
  const groupNames = Array.from(groupedSegments.keys());
  const defaultGroup = groupNames[0] || 'All';

  const { activeGroup, setActiveGroup } = useGroupTabs();
  
  // Use useEffect to update the active group when needed
  React.useEffect(() => {
    // If the current active group doesn't exist in groupNames or is null/undefined
    if (!activeGroup || !groupNames.includes(activeGroup)) {
      setActiveGroup(defaultGroup);
    }
  }, [activeGroup, defaultGroup, groupNames, setActiveGroup]);

  if (!representation || !segmentation) {
    return null;
  }

  return (
    <Tabs
      defaultValue={defaultGroup}
      value={activeGroup}
      onValueChange={setActiveGroup}
      className="w-full"
    >
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
                  const { segmentIndex } = segment;
                  const { locked, active, label, displayText, color, visible } = segmentData;
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

// Export the unmodified component separately for direct use
export { SegmentationTabsView };
