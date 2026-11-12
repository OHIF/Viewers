const expandedInsideBorderSize = 0;
const collapsedInsideBorderSize = 4;
const collapsedOutsideBorderSize = 4;
const collapsedWidth = 25;

const getPanelGroupDefinition = ({
  leftPanelInitialExpandedWidth = 282,
  rightPanelInitialExpandedWidth = 280,
  leftPanelMinimumExpandedWidth = 145,
  rightPanelMinimumExpandedWidth = 280,
}) => {
  return {
    groupId: 'viewerLayoutResizablePanelGroup',
    shared: {
      expandedInsideBorderSize,
      collapsedInsideBorderSize,
      collapsedOutsideBorderSize,
      collapsedWidth,
    },
    left: {
      // id
      panelId: 'viewerLayoutResizableLeftPanel',
      // expanded width
      initialExpandedWidth: leftPanelInitialExpandedWidth,
      // expanded width + expanded inside border
      minimumExpandedOffsetWidth: leftPanelMinimumExpandedWidth + expandedInsideBorderSize,
      // initial expanded width
      initialExpandedOffsetWidth: leftPanelInitialExpandedWidth + expandedInsideBorderSize,
      // collapsed width + collapsed inside border + collapsed outside border
      collapsedOffsetWidth: collapsedWidth + collapsedInsideBorderSize + collapsedOutsideBorderSize,
    },
    right: {
      panelId: 'viewerLayoutResizableRightPanel',
      initialExpandedWidth: rightPanelInitialExpandedWidth,
      minimumExpandedOffsetWidth: rightPanelMinimumExpandedWidth + expandedInsideBorderSize,
      initialExpandedOffsetWidth: rightPanelInitialExpandedWidth + expandedInsideBorderSize,
      collapsedOffsetWidth: collapsedWidth + collapsedInsideBorderSize + collapsedOutsideBorderSize,
    },
  };
};

export { getPanelGroupDefinition };
