import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { getPanelElement, getPanelGroupElement } from 'react-resizable-panels';

// Id needed to grab the panel group for converting pixels to percentages
const viewerLayoutResizablePanelGroupId = 'viewerLayoutResizablePanelGroup';
const viewerLayoutResizableLeftPanelId = 'viewerLayoutResizableLeftPanel';
const viewerLayoutResizableRightPanelId = 'viewerLayoutResizableRightPanel';

const sidePanelExpandedDefaultWidth = 280;
const sidePanelExpandedInsideBorderSize = 4;
const sidePanelExpandedDefaultOffsetWidth =
  sidePanelExpandedDefaultWidth + sidePanelExpandedInsideBorderSize;
const sidePanelCollapsedInsideBorderSize = 4;
const sidePanelCollapsedOutsideBorderSize = 8;
const sidePanelCollapsedWidth = 25;
const sidePanelCollapsedOffsetWidth =
  sidePanelCollapsedWidth +
  sidePanelCollapsedInsideBorderSize +
  sidePanelCollapsedOutsideBorderSize;

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
    sidePanelExpandedDefaultWidth
  );
  const [rightPanelExpandedWidth, setRightPanelExpandedWidth] = useState(
    sidePanelExpandedDefaultWidth
  );

  // Percentage sizes.
  const [resizablePanelCollapsedSize, setResizablePanelCollapsedSize] = useState(0);
  const [resizablePanelDefaultSize, setResizablePanelDefaultSize] = useState(0);

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
    const panelGroupElem = getPanelGroupElement(viewerLayoutResizablePanelGroupId);

    resizablePanelGroupElemRef.current = panelGroupElem;
    const { width: panelGroupWidth } = panelGroupElem.getBoundingClientRect();

    const leftPanelElem = getPanelElement(viewerLayoutResizableLeftPanelId);
    resizableLeftPanelElemRef.current = leftPanelElem;

    const rightPanelElem = getPanelElement(viewerLayoutResizableRightPanelId);
    resizableRightPanelElemRef.current = rightPanelElem;

    const resizablePanelExpandedSize =
      (sidePanelExpandedDefaultOffsetWidth / panelGroupWidth) * 100;

    // Since both resizable panels are collapsed by default (i.e. their default size is zero),
    // on the very first render check if either/both side panels should be expanded.
    if (!leftPanelClosed) {
      resizableLeftPanelAPIRef?.current?.expand(resizablePanelExpandedSize);
      setMinMaxWidth(leftPanelElem, sidePanelExpandedDefaultOffsetWidth);
    }

    if (!rightPanelClosed) {
      resizableRightPanelAPIRef?.current?.expand(resizablePanelExpandedSize);
      setMinMaxWidth(rightPanelElem, sidePanelExpandedDefaultOffsetWidth);
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
        ((leftPanelExpandedWidth + sidePanelExpandedInsideBorderSize) / panelGroupWidth) * 100;
      resizableLeftPanelAPIRef.current.resize(leftSize);
    }

    if (!resizableRightPanelAPIRef.current.isCollapsed()) {
      const rightSize =
        ((rightPanelExpandedWidth + sidePanelExpandedInsideBorderSize) / panelGroupWidth) * 100;
      resizableRightPanelAPIRef.current.resize(rightSize);
    }

    // This observer kicks in when the ViewportLayout resizable panel group
    // component is resized. This typically occurs when the browser window resizes.
    const observer = new ResizeObserver(() => {
      const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
      const defaultSize = (sidePanelExpandedDefaultOffsetWidth / panelGroupWidth) * 100;

      // Set the new default and collapsed resizable panel sizes.
      setResizablePanelDefaultSize(Math.min(50, defaultSize));
      setResizablePanelCollapsedSize((sidePanelCollapsedOffsetWidth / panelGroupWidth) * 100);

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
        ? sidePanelCollapsedOffsetWidth
        : leftPanelExpandedWidth + sidePanelExpandedInsideBorderSize;

      let rightPanelOffsetWidth = resizableRightPanelAPIRef.current.isCollapsed()
        ? sidePanelCollapsedOffsetWidth
        : rightPanelExpandedWidth + sidePanelExpandedInsideBorderSize;

      if (
        !resizableLeftPanelAPIRef.current.isCollapsed() &&
        leftPanelOffsetWidth + rightPanelOffsetWidth > panelGroupWidth
      ) {
        // There is not enough space to show both panels at their pre-resize widths.
        // Note that at this point, the viewport grid component is zero width.
        // Reduce the left panel width so that both panels might fit.
        leftPanelOffsetWidth = Math.max(
          panelGroupWidth - rightPanelOffsetWidth,
          sidePanelExpandedDefaultOffsetWidth
        );
        setLeftPanelExpandedWidth(leftPanelOffsetWidth - sidePanelExpandedInsideBorderSize);
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
          sidePanelExpandedDefaultOffsetWidth
        );
        setRightPanelExpandedWidth(rightPanelOffsetWidth - sidePanelExpandedInsideBorderSize);
        setMinMaxWidth(resizableRightPanelElemRef.current, rightPanelOffsetWidth);
      }
    });

    observer.observe(resizablePanelGroupElemRef.current);

    return () => {
      observer.disconnect();
    };
  }, [leftPanelExpandedWidth, resizablePanelDefaultSize, rightPanelExpandedWidth]);

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
            leftPanelExpandedWidth + sidePanelExpandedInsideBorderSize
          );
        }

        if (resizableRightPanelAPIRef?.current?.isExpanded()) {
          setMinMaxWidth(
            resizableRightPanelElemRef.current,
            rightPanelExpandedWidth + sidePanelExpandedInsideBorderSize
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
    resizableLeftPanelAPIRef?.current?.expand();
    if (!isResizableHandleDraggingRef.current) {
      setMinMaxWidth(
        resizableLeftPanelElemRef.current,
        leftPanelExpandedWidth + sidePanelExpandedInsideBorderSize
      );
    }
    setLeftPanelClosed(false);
  }, [leftPanelExpandedWidth, setLeftPanelClosed]);

  const onLeftPanelResize = useCallback(size => {
    if (resizableLeftPanelAPIRef.current.isCollapsed()) {
      return;
    }

    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    setLeftPanelExpandedWidth((size / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize);
  }, []);

  const onRightPanelClose = useCallback(() => {
    setRightPanelClosed(true);
    setMinMaxWidth(resizableRightPanelElemRef.current);
    resizableRightPanelAPIRef?.current?.collapse();
  }, [setRightPanelClosed]);

  const onRightPanelOpen = useCallback(() => {
    resizableRightPanelAPIRef?.current?.expand();
    if (!isResizableHandleDraggingRef.current) {
      setMinMaxWidth(
        resizableRightPanelElemRef.current,
        rightPanelExpandedWidth + sidePanelExpandedInsideBorderSize
      );
    }
    setRightPanelClosed(false);
  }, [rightPanelExpandedWidth, setRightPanelClosed]);

  const onRightPanelResize = useCallback(size => {
    if (resizableRightPanelAPIRef?.current?.isCollapsed()) {
      return;
    }
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    setRightPanelExpandedWidth((size / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize);
  }, []);

  return [
    {
      expandedWidth: leftPanelExpandedWidth,
      collapsedWidth: sidePanelCollapsedWidth,
      collapsedInsideBorderSize: sidePanelCollapsedInsideBorderSize,
      collapsedOutsideBorderSize: sidePanelCollapsedOutsideBorderSize,
      expandedInsideBorderSize: sidePanelExpandedInsideBorderSize,
      onClose: onLeftPanelClose,
      onOpen: onLeftPanelOpen,
    },
    {
      expandedWidth: rightPanelExpandedWidth,
      collapsedWidth: sidePanelCollapsedWidth,
      collapsedInsideBorderSize: sidePanelCollapsedInsideBorderSize,
      collapsedOutsideBorderSize: sidePanelCollapsedOutsideBorderSize,
      expandedInsideBorderSize: sidePanelExpandedInsideBorderSize,
      onClose: onRightPanelClose,
      onOpen: onRightPanelOpen,
    },
    { direction: 'horizontal', id: viewerLayoutResizablePanelGroupId },
    {
      defaultSize: resizablePanelDefaultSize,
      minSize: resizablePanelDefaultSize,
      onResize: onLeftPanelResize,
      collapsible: true,
      collapsedSize: resizablePanelCollapsedSize,
      onCollapse: () => setLeftPanelClosed(true),
      onExpand: () => setLeftPanelClosed(false),
      ref: resizableLeftPanelAPIRef,
      order: 0,
      id: viewerLayoutResizableLeftPanelId,
    },
    { order: 1, id: 'viewerLayoutResizableViewportGridPanel' },
    {
      defaultSize: resizablePanelDefaultSize,
      minSize: resizablePanelDefaultSize,
      onResize: onRightPanelResize,
      collapsible: true,
      collapsedSize: resizablePanelCollapsedSize,
      onCollapse: () => setRightPanelClosed(true),
      onExpand: () => setRightPanelClosed(false),
      ref: resizableRightPanelAPIRef,
      order: 2,
      id: viewerLayoutResizableRightPanelId,
    },
    onHandleDragging,
  ];
};

export default useResizablePanels;
