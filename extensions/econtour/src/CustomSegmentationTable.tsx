import React from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { SegmentationTabsView } from './SegmentationTabsView';

// This component extends the core SegmentationTable functionality
// by adding a custom tabbed view for segments
const CustomSegmentationTable = React.forwardRef((props, ref) => {
  // Add the custom tab view component
  const renderSegmentsWithTabs = () => {
    return <SegmentationTabsView />;
  };

  // Render content based on mode
  const renderModeContent = () => {
    if (props.mode === 'collapsed') {
      return (
        <SegmentationTable.Collapsed>
          <SegmentationTable.Collapsed.Header>
            <SegmentationTable.Collapsed.DropdownMenu>
              {props.renderCustomDropdownContent && props.renderCustomDropdownContent()}
            </SegmentationTable.Collapsed.DropdownMenu>
            <SegmentationTable.Collapsed.Selector />
            <SegmentationTable.Collapsed.Info />
          </SegmentationTable.Collapsed.Header>
          <SegmentationTable.Collapsed.Content>
            <SegmentationTable.AddSegmentRow />
            {/* Use our custom tabbed segments view instead of default segments */}
            {renderSegmentsWithTabs()}
          </SegmentationTable.Collapsed.Content>
        </SegmentationTable.Collapsed>
      );
    }

    return (
      <>
        <SegmentationTable.Expanded>
          <SegmentationTable.Expanded.Header>
            <SegmentationTable.Expanded.DropdownMenu>
              {props.renderCustomDropdownContent && props.renderCustomDropdownContent()}
            </SegmentationTable.Expanded.DropdownMenu>
            <SegmentationTable.Expanded.Label />
            <SegmentationTable.Expanded.Info />
          </SegmentationTable.Expanded.Header>

          <SegmentationTable.Expanded.Content>
            <SegmentationTable.AddSegmentRow />
            {/* Use our custom tabbed segments view instead of default segments */}
            {renderSegmentsWithTabs()}
          </SegmentationTable.Expanded.Content>
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
