import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { getPanelElement, getPanelGroupElement } from 'react-resizable-panels';
import { getPanelGroupDefinition } from './constants/panels';

/**
 * Set the minimum and maximum css style width attributes for the given element.
 * The two style attributes are cleared whenever the width
 * argument is undefined.
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
  if (!elem) {
    return;
  }

  elem.style.minWidth = width === undefined ? '' : `${width}px`;
  elem.style.maxWidth = elem.style.minWidth;
};

const useResizablePanels = (
  leftPanelClosed,
  setLeftPanelClosed,
  rightPanelClosed,
  setRightPanelClosed,
  hasLeftPanels,
  hasRightPanels,
  leftPanelInitialExpandedWidth,
  rightPanelInitialExpandedWidth,
  leftPanelMinimumExpandedWidth,
  rightPanelMinimumExpandedWidth
) => {
  const [panelGroupDefinition] = useState(
    getPanelGroupDefinition({
      leftPanelInitialExpandedWidth,
      rightPanelInitialExpandedWidth,
      leftPanelMinimumExpandedWidth,
      rightPanelMinimumExpandedWidth,
    })
  );

  const [leftPanelExpandedWidth, setLeftPanelExpandedWidth] = useState(
    panelGroupDefinition.left.initialExpandedWidth
  );
  const [rightPanelExpandedWidth, setRightPanelExpandedWidth] = useState(
    panelGroupDefinition.right.initialExpandedWidth
  );
  const [leftResizablePanelMinimumSize, setLeftResizablePanelMinimumSize] = useState(0);
  const [rightResizablePanelMinimumSize, setRightResizablePanelMinimumSize] = useState(0);
  const [leftResizablePanelCollapsedSize, setLeftResizePanelCollapsedSize] = useState(0);
  const [rightResizePanelCollapsedSize, setRightResizePanelCollapsedSize] = useState(0);

  const resizablePanelGroupElemRef = useRef(null);
  const resizableLeftPanelElemRef = useRef(null);
  const resizableRightPanelElemRef = useRef(null);
  const resizableLeftPanelAPIRef = useRef(null);
  const resizableRightPanelAPIRef = useRef(null);
  const isResizableHandleDraggingRef = useRef(false);

  // The total width of both handles.
  const resizableHandlesWidth = useRef(null);

  // This useLayoutEffect is used to...
  // - Grab a reference to the various resizable panel elements needed for
  //   converting between percentages and pixels in various callbacks.
  // - Expand those panels that are initially expanded.
  useLayoutEffect(() => {
    const panelGroupElem = getPanelGroupElement(panelGroupDefinition.groupId);
    resizablePanelGroupElemRef.current = panelGroupElem;

    const leftPanelElem = getPanelElement(panelGroupDefinition.left.panelId);
    resizableLeftPanelElemRef.current = leftPanelElem;

    const rightPanelElem = getPanelElement(panelGroupDefinition.right.panelId);
    resizableRightPanelElemRef.current = rightPanelElem;

    // Calculate and set the width of both handles combined.
    const resizeHandles = document.querySelectorAll('[data-panel-resize-handle-id]');
    resizableHandlesWidth.current = 0;
    resizeHandles.forEach(resizeHandle => {
      resizableHandlesWidth.current += resizeHandle.offsetWidth;
    });

    // Since both resizable panels are collapsed by default (i.e. their default size is zero),
    // on the very first render check if either/both side panels should be expanded.
    // we use the initialExpandedOffsetWidth on the first render incase the panel has min width but we want the initial state to be larger than that

    if (!leftPanelClosed) {
      const leftResizablePanelExpandedSize = getPercentageSize(
        panelGroupDefinition.left.initialExpandedOffsetWidth
      );
      resizableLeftPanelAPIRef?.current?.expand(leftResizablePanelExpandedSize);
      setMinMaxWidth(leftPanelElem, panelGroupDefinition.left.initialExpandedOffsetWidth);
    }

    if (!rightPanelClosed) {
      const rightResizablePanelExpandedSize = getPercentageSize(
        panelGroupDefinition.right.initialExpandedOffsetWidth
      );
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
    // Ensure the side panels' percentage size is in synch with the pixel width of the
    // expanded side panels. In general the two get out-of-sync during a browser
    // window resize. Note that this code is here and NOT in the ResizeObserver
    // because it has to be done AFTER the minimum percentage size for a panel is
    // updated which occurs only AFTER the render following a browser window resize.
    // And by virtue of the dependency on the minimum size state variables, this code
    // is executed on the render following an update of the minimum percentage sizes
    // for a panel.
    if (!resizableLeftPanelAPIRef.current?.isCollapsed()) {
      const leftSize = getPercentageSize(
        leftPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize
      );
      resizableLeftPanelAPIRef.current?.resize(leftSize);
    }

    if (!resizableRightPanelAPIRef?.current?.isCollapsed()) {
      const rightSize = getPercentageSize(
        rightPanelExpandedWidth + panelGroupDefinition.shared.expandedInsideBorderSize
      );
      resizableRightPanelAPIRef?.current?.resize(rightSize);
    }

    // This observer kicks in when the ViewportLayout resizable panel group
    // component is resized. This typically occurs when the browser window resizes.
    const observer = new ResizeObserver(() => {
      const minimumLeftSize = getPercentageSize(
        panelGroupDefinition.left.minimumExpandedOffsetWidth
      );
      const minimumRightSize = getPercentageSize(
        panelGroupDefinition.right.minimumExpandedOffsetWidth
      );

      // Set the new minimum and collapsed resizable panel sizes.
      setLeftResizablePanelMinimumSize(minimumLeftSize);
      setRightResizablePanelMinimumSize(minimumRightSize);
      setLeftResizePanelCollapsedSize(
        getPercentageSize(panelGroupDefinition.left.collapsedOffsetWidth)
      );
      setRightResizePanelCollapsedSize(
        getPercentageSize(panelGroupDefinition.right.collapsedOffsetWidth)
      );
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
    hasLeftPanels,
    hasRightPanels,
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
    resizableLeftPanelAPIRef?.current?.expand(
      getPercentageSize(panelGroupDefinition.left.initialExpandedOffsetWidth)
    );
    setLeftPanelClosed(false);
  }, [setLeftPanelClosed]);

  const onLeftPanelResize = useCallback(size => {
    if (!resizablePanelGroupElemRef?.current || resizableLeftPanelAPIRef.current?.isCollapsed()) {
      return;
    }

    const newExpandedWidth = getExpandedPixelWidth(size);
    setLeftPanelExpandedWidth(newExpandedWidth);

    if (!isResizableHandleDraggingRef.current) {
      // This typically gets executed when the left panel is expanded via one of the UI
      // buttons. It is done here instead of in the onLeftPanelOpen method
      // because here we know the size of the expanded panel.
      setMinMaxWidth(resizableLeftPanelElemRef.current, newExpandedWidth);
    }
  }, []);

  const onRightPanelClose = useCallback(() => {
    setRightPanelClosed(true);
    setMinMaxWidth(resizableRightPanelElemRef.current);
    resizableRightPanelAPIRef?.current?.collapse();
  }, [setRightPanelClosed]);

  const onRightPanelOpen = useCallback(() => {
    resizableRightPanelAPIRef?.current?.expand(
      getPercentageSize(panelGroupDefinition.right.initialExpandedOffsetWidth)
    );
    setRightPanelClosed(false);
  }, [setRightPanelClosed]);

  const onRightPanelResize = useCallback(size => {
    if (!resizablePanelGroupElemRef?.current || resizableRightPanelAPIRef?.current?.isCollapsed()) {
      return;
    }

    const newExpandedWidth = getExpandedPixelWidth(size);
    setRightPanelExpandedWidth(newExpandedWidth);

    if (!isResizableHandleDraggingRef.current) {
      // This typically gets executed when the right panel is expanded via one of the UI
      // buttons. It is done here instead of in the onRightPanelOpen method
      // because here we know the size of the expanded panel.
      setMinMaxWidth(resizableRightPanelElemRef.current, newExpandedWidth);
    }
  }, []);

  /**
   * Gets the percentage size corresponding to the given pixel size.
   * Note that the width attributed to the handles must be taken into account.
   */
  const getPercentageSize = pixelSize => {
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current?.getBoundingClientRect();
    return (pixelSize / (panelGroupWidth - resizableHandlesWidth.current)) * 100;
  };

  /**
   * Gets the width in pixels for an expanded panel given its percentage size/width.
   * Note that the width attributed to the handles must be taken into account.
   */
  const getExpandedPixelWidth = percentageSize => {
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current?.getBoundingClientRect();
    const expandedWidth =
      (percentageSize / 100) * (panelGroupWidth - resizableHandlesWidth.current) -
      panelGroupDefinition.shared.expandedInsideBorderSize;
    return expandedWidth;
  };

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
      collapsedSize: leftResizablePanelCollapsedSize,
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
