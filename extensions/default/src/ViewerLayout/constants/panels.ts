const expandedInsideBorderSize = 4;
const collapsedInsideBorderSize = 4;
const collapsedOutsideBorderSize = 8;

const panelGroupDefinition = {
  groupId: 'viewerLayoutResizablePanelGroup',
  shared: {
    expandedInsideBorderSize,
    collapsedInsideBorderSize,
    collapsedOutsideBorderSize,
    collapsedWidth: 25,
  },
  left: {
    // id
    panelId: 'viewerLayoutResizableLeftPanel',
    // expanded width
    initialExpandedWidth: 282,
    // expanded width + expanded inside border
    minimumExpandedOffsetWidth: 145 + expandedInsideBorderSize,
    // initial expanded width
    initialExpandedOffsetWidth: 282 + expandedInsideBorderSize,
    // collapsed width + collapsed inside border + collapsed outside border
    collapsedOffsetWidth: 25 + collapsedInsideBorderSize + collapsedOutsideBorderSize,
  },
  right: {
    panelId: 'viewerLayoutResizableRightPanel',
    initialExpandedWidth: 280,
    minimumExpandedOffsetWidth: 280 + expandedInsideBorderSize,
    initialExpandedOffsetWidth: 280 + expandedInsideBorderSize,
    collapsedOffsetWidth: 25 + collapsedInsideBorderSize + collapsedOutsideBorderSize,
  },
};

export { panelGroupDefinition };
