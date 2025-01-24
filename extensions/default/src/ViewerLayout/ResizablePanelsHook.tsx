import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { getPanelElement, getPanelGroupElement } from 'react-resizable-panels';
import { panelGroupDefinition } from './constants/panels';

/**
 * Set the minimum and maximum css style width attributes for the given element.
 * The two style attributes are cleared whenever the width
 * arguments is undefined.
 * <p>
 * This utility is used as part of a HACK throughout the ViewerLayout component as
 * the means of restricting the side panel widths during the resizing of the
 * browser window. In general, the widths are always set unless the resize
 * handle for either side panel is being dragged (i.e. a side panel is being resized).
 *
 * @param elem the element
 * @param width the max and min width to set on the element
 */
const setMinMaxWidth = (elem, width?) => {
  elem.style.minWidth = width === undefined ? '' : `${width}px`;
  elem.style.maxWidth = elem.style.minWidth;
};

const useResizablePanels = (
  leftPanelClosed,
  setLeftPanelClosed,
  rightPanelClosed,
  setRightPanelClosed
) => {
  const [leftPanelExpandedWidth, setLeftPanelExpandedWidth] = useState(
    panelGroupDefinition.left.initialExpandedWidth
  );
  const [rightPanelExpandedWidth, setRightPanelExpandedWidth] = useState(
    panelGroupDefinition.right.initialExpandedWidth
  );
  const [leftResizablePanelMinimumSize, setLeftResizablePanelMinimumSize] = useState(0);
  const [rightResizablePanelMinimumSize, setRightResizablePanelMinimumSize] = useState(0);
  const [leftResizeablePanelCollapsedSize, setLeftResizePanelCollapsedSize] = useState(0);
  const [rightResizePanelCollapsedSize, setRightResizePanelCollapsedSize] = useState(0);

  const resizablePanelGroupElemRef = useRef(null);
  const resizableLeftPanelElemRef = useRef(null);
  const resizableRightPanelElemRef = useRef(null);
  const resizableLeftPanelAPIRef = useRef(null);
  const resizableRightPanelAPIRef = useRef(null);
  const isResizableHandleDraggingRef = useRef(false);

  // This useLayoutEffect is used to...
  // - Grab a reference to the various resizable panel elements needed for
  //   converting between percentages and pixels in various callbacks.
  // - Expand those panels that are initially expanded.
  useLayoutEffect(() => {
    const panelGroupElem = getPanelGroupElement(panelGroupDefinition.groupId);

    resizablePanelGroupElemRef.current = panelGroupElem;
    const { width: panelGroupWidth } = panelGroupElem.getBoundingClientRect();

    const leftPanelElem = getPanelElement(panelGroupDefinition.left.panelId);
    resizableLeftPanelElemRef.current = leftPanelElem;

    const rightPanelElem = getPanelElement(panelGroupDefinition.right.panelId);
    resizableRightPanelElemRef.current = rightPanelElem;

    // Since both resizable panels are collapsed by default (i.e. their default size is zero),
    // on the very first render check if either/both side panels should be expanded.
    // we use the initialExpandedOffsetWidth on the first render incase the panel has min width but we want the initial state to be larger than that

    if (!leftPanelClosed) {
      const leftResizablePanelExpandedSize =
        (panelGroupDefinition.left.initialExpandedOffsetWidth / panelGroupWidth) * 100;
      resizableLeftPanelAPIRef?.current?.expand(leftResizablePanelExpandedSize);
      setMinMaxWidth(leftPanelElem, panelGroupDefinition.left.initialExpandedOffsetWidth);
    }

    if (!rightPanelClosed) {
      const rightResizablePanelExpandedSize =
        (panelGroupDefinition.right.initialExpandedOffsetWidth / panelGroupWidth) * 100;
      resizableRightPanelAPIRef?.current?.expand(rightResizablePanelExpandedSize);
      setMinMaxWidth(rightPanelElem, panelGroupDefinition.right.initialExpandedOffsetWidth);
    }
  }, []); // no dependencies because this useLayoutEffect is only needed on the very first render

  // This useLayoutEffect follows the pattern prescribed by the react-resizable-panels
  // readme for converting between pixel values and percentages. An example of
  // the pattern can be found here:
  // https://github.com/bvaughn/react-resizable-panels/issues/46#issuecomment-1368108416
  // This useLayoutEffect is used to...
  // - Ensure that the percentage size is up-to-date with the pixel sizes
  // - Add a resize observer to the resizable panel group to reset various state
  //   values whenever the resizable panel group is resized (e.g. whenever the
  //   browser window is resized).
  useLayoutEffect(() => {
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();

    // Ensure the side panels' percentage size is in synch with the pixel width of the
    // expanded side panels. In general the two get out-of-sync during a browser
    // window resize. Note that this code is here and NOT in the ResizeObserver
    // because it has to be done AFTER the minimum percentage size for a panel is
    // updated which occurs only AFTER the render following a resize. And by virtue
    // of the dependency on the  `resizablePanelDefaultSize` state, this code
    // is executed on the render following an update of the minimum percentage size
    // for a panel.
    if (!resizableLeftPanelAPIRef.current.isCollapsed()) {
      const leftSize =
        ((leftPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize) /
          panelGroupWidth) *
        100;
      resizableLeftPanelAPIRef.current.resize(leftSize);
    }

    if (!resizableRightPanelAPIRef.current.isCollapsed()) {
      const rightSize =
        ((rightPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize) /
          panelGroupWidth) *
        100;
      resizableRightPanelAPIRef.current.resize(rightSize);
    }

    // This observer kicks in when the ViewportLayout resizable panel group
    // component is resized. This typically occurs when the browser window resizes.
    const observer = new ResizeObserver(() => {
      const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
      const minimumLeftSize =
        (panelGroupDefinition.left.minimumExpandedOffsetWidth / panelGroupWidth) * 100;
      const minimumRightSize =
        (panelGroupDefinition.right.minimumExpandedOffsetWidth / panelGroupWidth) * 100;

      // Set the new default and collapsed resizable panel sizes.
      setLeftResizablePanelMinimumSize(Math.min(50, minimumLeftSize));
      setRightResizablePanelMinimumSize(Math.min(50, minimumRightSize));
      setLeftResizePanelCollapsedSize(
        (panelGroupDefinition.left.collapsedOffsetWidth / panelGroupWidth) * 100
      );
      setRightResizePanelCollapsedSize(
        (panelGroupDefinition.right.collapsedOffsetWidth / panelGroupWidth) * 100
      );

      if (
        resizableLeftPanelAPIRef.current.isCollapsed() &&
        resizableRightPanelAPIRef.current.isCollapsed()
      ) {
        return;
      }

      // The code that follows is to handle cases when the group panel is resized to be
      // too small to display either side panel at its current width.

      // Determine the current widths of the two side panels.
      let leftPanelOffsetWidth = resizableLeftPanelAPIRef.current.isCollapsed()
        ? panelGroupDefinition.left.collapsedOffsetWidth
        : leftPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize;

      let rightPanelOffsetWidth = resizableRightPanelAPIRef.current.isCollapsed()
        ? panelGroupDefinition.right.collapsedOffsetWidth
        : rightPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize;

      if (
        !resizableLeftPanelAPIRef.current.isCollapsed() &&
        leftPanelOffsetWidth + rightPanelOffsetWidth > panelGroupWidth
      ) {
        // There is not enough space to show both panels at their pre-resize widths.
        // Note that at this point, the viewport grid component is zero width.
        // Reduce the left panel width so that both panels might fit.
        leftPanelOffsetWidth = Math.max(
          panelGroupWidth - rightPanelOffsetWidth,
          panelGroupDefinition.left.minimumExpandedOffsetWidth
        );
        setLeftPanelExpandedWidth(
          leftPanelOffsetWidth - panelGroupDefinition.shared.expandedInsideBorderSize
        );
        setMinMaxWidth(resizableLeftPanelElemRef.current, leftPanelOffsetWidth);
      }

      if (
        !resizableRightPanelAPIRef.current.isCollapsed() &&
        rightPanelOffsetWidth + leftPanelOffsetWidth > panelGroupWidth
      ) {
        // There is not enough space to show both panels at their pre-resize widths.
        // Note that at this point, the viewport grid component is zero width.
        // Reduce the right panel width so that both panels might fit.
        rightPanelOffsetWidth = Math.max(
          panelGroupWidth - leftPanelOffsetWidth,
          panelGroupDefinition.right.minimumExpandedOffsetWidth
        );
        setRightPanelExpandedWidth(
          rightPanelOffsetWidth - panelGroupDefinition.shared.expandedInsideBorderSize
        );
        setMinMaxWidth(resizableRightPanelElemRef.current, rightPanelOffsetWidth);
      }
    });

    observer.observe(resizablePanelGroupElemRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    leftPanelExpandedWidth,
    rightPanelExpandedWidth,
    leftResizablePanelMinimumSize,
    rightResizablePanelMinimumSize,
  ]);

  /**
   * Handles dragging of either side panel resize handle.
   */
  const onHandleDragging = useCallback(
    isStartDrag => {
      if (isStartDrag) {
        isResizableHandleDraggingRef.current = true;

        setMinMaxWidth(resizableLeftPanelElemRef.current);
        setMinMaxWidth(resizableRightPanelElemRef.current);
      } else {
        isResizableHandleDraggingRef.current = false;

        if (resizableLeftPanelAPIRef?.current?.isExpanded()) {
          setMinMaxWidth(
            resizableLeftPanelElemRef.current,
            leftPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize
          );
        }

        if (resizableRightPanelAPIRef?.current?.isExpanded()) {
          setMinMaxWidth(
            resizableRightPanelElemRef.current,
            rightPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize
          );
        }
      }
    },
    [leftPanelExpandedWidth, rightPanelExpandedWidth]
  );

  const onLeftPanelClose = useCallback(() => {
    setLeftPanelClosed(true);
    setMinMaxWidth(resizableLeftPanelElemRef.current);
    resizableLeftPanelAPIRef?.current?.collapse();
  }, [setLeftPanelClosed]);

  const onLeftPanelOpen = useCallback(() => {
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    resizableLeftPanelAPIRef?.current?.expand(
      (panelGroupDefinition.left.initialExpandedOffsetWidth / panelGroupWidth) * 100
    );
    setLeftPanelClosed(false);
  }, [setLeftPanelClosed]);

  const onLeftPanelResize = useCallback(size => {
    if (resizableLeftPanelAPIRef.current.isCollapsed()) {
      return;
    }

    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    const newExpandedWidth =
      (size / 100) * panelGroupWidth - panelGroupDefinition.shared.expandedInsideBorderSize;

    setLeftPanelExpandedWidth(newExpandedWidth);
  }, []);

  const onRightPanelClose = useCallback(() => {
    setRightPanelClosed(true);
    setMinMaxWidth(resizableRightPanelElemRef.current);
    resizableRightPanelAPIRef?.current?.collapse();
  }, [setRightPanelClosed]);

  const onRightPanelOpen = useCallback(() => {
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    resizableRightPanelAPIRef?.current?.expand(
      (panelGroupDefinition.right.initialExpandedOffsetWidth / panelGroupWidth) * 100
    );
    setRightPanelClosed(false);
  }, [setRightPanelClosed]);

  const onRightPanelResize = useCallback(size => {
    if (resizableRightPanelAPIRef?.current?.isCollapsed()) {
      return;
    }

    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    const newExpandedWidth =
      (size / 100) * panelGroupWidth - panelGroupDefinition.shared.expandedInsideBorderSize;

    setRightPanelExpandedWidth(newExpandedWidth);
  }, []);

  return [
    {
      expandedWidth: leftPanelExpandedWidth,
      collapsedWidth: panelGroupDefinition.shared.collapsedWidth,
      collapsedInsideBorderSize: panelGroupDefinition.shared.collapsedInsideBorderSize,
      collapsedOutsideBorderSize: panelGroupDefinition.shared.collapsedOutsideBorderSize,
      expandedInsideBorderSize: panelGroupDefinition.shared.expandedInsideBorderSize,
      onClose: onLeftPanelClose,
      onOpen: onLeftPanelOpen,
    },
    {
      expandedWidth: rightPanelExpandedWidth,
      collapsedWidth: panelGroupDefinition.shared.collapsedWidth,
      collapsedInsideBorderSize: panelGroupDefinition.shared.collapsedInsideBorderSize,
      collapsedOutsideBorderSize: panelGroupDefinition.shared.collapsedOutsideBorderSize,
      expandedInsideBorderSize: panelGroupDefinition.shared.expandedInsideBorderSize,
      onClose: onRightPanelClose,
      onOpen: onRightPanelOpen,
    },
    { direction: 'horizontal', id: panelGroupDefinition.groupId },
    {
      defaultSize: leftResizablePanelMinimumSize,
      minSize: leftResizablePanelMinimumSize,
      onResize: onLeftPanelResize,
      collapsible: true,
      collapsedSize: leftResizeablePanelCollapsedSize,
      onCollapse: () => setLeftPanelClosed(true),
      onExpand: () => setLeftPanelClosed(false),
      ref: resizableLeftPanelAPIRef,
      order: 0,
      id: panelGroupDefinition.left.panelId,
    },
    { order: 1, id: 'viewerLayoutResizableViewportGridPanel' },
    {
      defaultSize: rightResizablePanelMinimumSize,
      minSize: rightResizablePanelMinimumSize,
      onResize: onRightPanelResize,
      collapsible: true,
      collapsedSize: rightResizePanelCollapsedSize,
      onCollapse: () => setRightPanelClosed(true),
      onExpand: () => setRightPanelClosed(false),
      ref: resizableRightPanelAPIRef,
      order: 2,
      id: panelGroupDefinition.right.panelId,
    },
    onHandleDragging,
  ];
};

export default useResizablePanels;
