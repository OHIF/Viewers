import React from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { SegmentationTabsView } from './SegmentationTabsView';
import { CustomAddSegmentRow } from './CustomAddSegmentRow';
import { GroupTabsProvider } from './GroupTabsView';
// This component extends the core SegmentationTable functionality
// by adding a custom tabbed view for segments
const CustomSegmentationTable = React.forwardRef((props, ref) => {
  // Add the custom tab view component with provider for group state management
  const renderSegmentsWithTabs = () => {
    return <SegmentationTabsView />;
  };

  // Render content based on mode
  const renderModeContent = () => {
    if (props.mode === 'collapsed') {
      return (
        <SegmentationTable.Collapsed>
          <SegmentationTable.Collapsed.Header>
            <SegmentationTable.Collapsed.Selector />
            <SegmentationTable.Collapsed.Info />
          </SegmentationTable.Collapsed.Header>
          <SegmentationTable.Collapsed.Content>
            <GroupTabsProvider>
              <CustomAddSegmentRow />
              {renderSegmentsWithTabs()}
            </GroupTabsProvider>
          </SegmentationTable.Collapsed.Content>
        </SegmentationTable.Collapsed>
      );
    }

    return (
      <>
        <SegmentationTable.Expanded>
          <SegmentationTable.Expanded.Header>
            <SegmentationTable.Expanded.Label />
            <SegmentationTable.Expanded.Info />
          </SegmentationTable.Expanded.Header>
          <GroupTabsProvider>
            <SegmentationTable.Expanded.Content>
              <CustomAddSegmentRow />
              {renderSegmentsWithTabs()}
            </SegmentationTable.Expanded.Content>
          </GroupTabsProvider>
        </SegmentationTable.Expanded>
      </>
    );
  };

  return (
    <SegmentationTable {...props} ref={ref}>
      {props.children}
      <SegmentationTable.Config />
      <SegmentationTable.AddSegmentationRow />
      {renderModeContent()}
    </SegmentationTable>
  );
});

CustomSegmentationTable.displayName = 'CustomSegmentationTable';

export default CustomSegmentationTable;
