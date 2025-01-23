const expandedInsideBorderSize = 4;
const collapsedInsideBorderSize = 4;
const collapsedOutsideBorderSize = 8;
const collapsedWidth = 25;

const rightPanelInitialExpandedWidth = 280;
const leftPanelInitialExpandedWidth = 282;

const panelGroupDefinition = {
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
    minimumExpandedOffsetWidth: 145 + expandedInsideBorderSize,
    // initial expanded width
    initialExpandedOffsetWidth: leftPanelInitialExpandedWidth + expandedInsideBorderSize,
    // collapsed width + collapsed inside border + collapsed outside border
    collapsedOffsetWidth: collapsedWidth + collapsedInsideBorderSize + collapsedOutsideBorderSize,
  },
  right: {
    panelId: 'viewerLayoutResizableRightPanel',
    initialExpandedWidth: rightPanelInitialExpandedWidth,
    minimumExpandedOffsetWidth: rightPanelInitialExpandedWidth + expandedInsideBorderSize,
    initialExpandedOffsetWidth: rightPanelInitialExpandedWidth + expandedInsideBorderSize,
    collapsedOffsetWidth: collapsedWidth + collapsedInsideBorderSize + collapsedOutsideBorderSize,
  },
};

export { panelGroupDefinition };
