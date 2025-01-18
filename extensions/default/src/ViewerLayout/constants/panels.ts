const panelGroupDefination = {
  groupId: 'viewerLayoutResizablePanelGroup',
  shared: {
    expandedInsideBorderSize: 4,
    collapsedInsideBorderSize: 4,
    collapsedOutsideBorderSize: 8,
    collapsedWidth: 25,
  },
  left: {
    // expanded width
    expandedDefaultWidth: 282,
    // expanded width + expanded inside border
    expandedDefaultOffsetWidth: 145 + 4,
    // initial expanded width
    initialExpandedDefaultOffsetWidth: 282 + 4,
    // collapsed width + collapsed inside border + collapsed outside border
    collapsedOffsetWidth: 25 + 4 + 8,
  },
  right: {
    expandedDefaultWidth: 280,
    expandedDefaultOffsetWidth: 280 + 4,
    initialExpandedDefaultOffsetWidth: 280 + 4,
    collapsedOffsetWidth: 25 + 4 + 8,
  },
};

export { panelGroupDefination };
