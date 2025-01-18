import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { getPanelElement, getPanelGroupElement } from 'react-resizable-panels';
import PropTypes from 'prop-types';

import { LoadingIndicatorProgress, InvestigationalUseDialog } from '@ohif/ui';
import { HangingProtocolService, CommandsManager } from '@ohif/core';
import { useAppConfig } from '@state';
import ViewerHeader from './ViewerHeader';
import SidePanelWithServices from '../Components/SidePanelWithServices';
import { Onboarding, ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ohif/ui-next';

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

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  // From Modes
  viewports,
  ViewportGridComp,
  leftPanelClosed = false,
  rightPanelClosed = false,
  leftPanelResizable = false,
  rightPanelResizable = false,
}: withAppTypes): React.FunctionComponent {
  const [appConfig] = useAppConfig();

  const { panelService, hangingProtocolService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const hasPanels = useCallback(
    (side): boolean => !!panelService.getPanels(side).length,
    [panelService]
  );

  const [hasRightPanels, setHasRightPanels] = useState(hasPanels('right'));
  const [hasLeftPanels, setHasLeftPanels] = useState(hasPanels('left'));
  const [leftPanelClosedState, setLeftPanelClosed] = useState(leftPanelClosed);
  const [rightPanelClosedState, setRightPanelClosed] = useState(rightPanelClosed);
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
  }, []);

  const onLeftPanelOpen = useCallback(() => {
    resizableLeftPanelAPIRef?.current?.expand();
    if (!isResizableHandleDraggingRef.current) {
      setMinMaxWidth(
        resizableLeftPanelElemRef.current,
        leftPanelExpandedWidth + sidePanelExpandedInsideBorderSize
      );
    }
    setLeftPanelClosed(false);
  }, [leftPanelExpandedWidth]);

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
  }, []);

  const onRightPanelOpen = useCallback(() => {
    resizableRightPanelAPIRef?.current?.expand();
    if (!isResizableHandleDraggingRef.current) {
      setMinMaxWidth(
        resizableRightPanelElemRef.current,
        rightPanelExpandedWidth + sidePanelExpandedInsideBorderSize
      );
    }
    setRightPanelClosed(false);
  }, [rightPanelExpandedWidth]);

  const onRightPanelResize = useCallback(size => {
    if (resizableRightPanelAPIRef?.current?.isCollapsed()) {
      return;
    }
    const { width: panelGroupWidth } = resizablePanelGroupElemRef.current.getBoundingClientRect();
    setRightPanelExpandedWidth((size / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize);
  }, []);

  /**
   * Set body classes (tailwindcss) that don't allow vertical
   * or horizontal overflow (no scrolling). Also guarantee window
   * is sized to our viewport.
   */
  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('bg-black');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);

    if (!entry || !entry.component) {
      throw new Error(
        `${id} is not valid for an extension module or no component found from extension ${id}. Please verify your configuration or ensure that the extension is properly registered. It's also possible that your mode is utilizing a module from an extension that hasn't been included in its dependencies (add the extension to the "extensionDependencies" array in your mode's index.js file). Check the reference string to the extension in your Mode configuration`
      );
    }

    return { entry, content: entry.component };
  };

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,

      // Todo: right now to set the loading indicator to false, we need to wait for the
      // hangingProtocolService to finish applying the viewport matching to each viewport,
      // however, this might not be the only approach to set the loading indicator to false. we need to explore this further.
      () => {
        setShowLoadingIndicator(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);

    return {
      component: entry.component,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(
      panelService.EVENTS.PANELS_CHANGED,
      ({ options }) => {
        setHasLeftPanels(hasPanels('left'));
        setHasRightPanels(hasPanels('right'));
        if (options?.leftPanelClosed !== undefined) {
          setLeftPanelClosed(options.leftPanelClosed);
        }
        if (options?.rightPanelClosed !== undefined) {
          setRightPanelClosed(options.rightPanelClosed);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [panelService, hasPanels]);

  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <ViewerHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div
        className="relative flex w-full flex-row flex-nowrap items-stretch overflow-hidden bg-black"
        style={{ height: 'calc(100vh - 52px' }}
      >
        <React.Fragment>
          {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-black" />}
          <ResizablePanelGroup
            direction="horizontal"
            id={viewerLayoutResizablePanelGroupId}
          >
            {/* LEFT SIDEPANELS */}

            {hasLeftPanels ? (
              <>
                <ResizablePanel
                  defaultSize={resizablePanelDefaultSize}
                  minSize={resizablePanelDefaultSize}
                  onResize={onLeftPanelResize}
                  collapsible={true}
                  collapsedSize={resizablePanelCollapsedSize}
                  onCollapse={() => setLeftPanelClosed(true)}
                  onExpand={() => setLeftPanelClosed(false)}
                  ref={resizableLeftPanelAPIRef}
                  order={0}
                  id={viewerLayoutResizableLeftPanelId}
                >
                  <SidePanelWithServices
                    side="left"
                    isExpanded={!leftPanelClosedState}
                    servicesManager={servicesManager}
                    expandedWidth={leftPanelExpandedWidth}
                    collapsedWidth={sidePanelCollapsedWidth}
                    collapsedInsideBorderSize={sidePanelCollapsedInsideBorderSize}
                    collapsedOutsideBorderSize={sidePanelCollapsedOutsideBorderSize}
                    expandedInsideBorderSize={sidePanelExpandedInsideBorderSize}
                    onClose={onLeftPanelClose}
                    onOpen={onLeftPanelOpen}
                  />
                </ResizablePanel>
                <ResizableHandle
                  onDragging={onHandleDragging}
                  disabled={!leftPanelResizable}
                  className="!w-0"
                />
              </>
            ) : null}
            {/* TOOLBAR + GRID */}
            <ResizablePanel
              order={1}
              id={'viewerLayoutResizableViewportGridPanel'}
            >
              <div className="flex h-full flex-1 flex-col">
                <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-black">
                  <ViewportGridComp
                    servicesManager={servicesManager}
                    viewportComponents={viewportComponents}
                    commandsManager={commandsManager}
                  />
                </div>
              </div>
            </ResizablePanel>
            {hasRightPanels ? (
              <>
                <ResizableHandle
                  onDragging={onHandleDragging}
                  disabled={!rightPanelResizable}
                  className="!w-0"
                />
                <ResizablePanel
                  defaultSize={resizablePanelDefaultSize}
                  minSize={resizablePanelDefaultSize}
                  onResize={onRightPanelResize}
                  collapsible={true}
                  collapsedSize={resizablePanelCollapsedSize}
                  onCollapse={() => setRightPanelClosed(true)}
                  onExpand={() => setRightPanelClosed(false)}
                  ref={resizableRightPanelAPIRef}
                  order={3}
                  id={viewerLayoutResizableRightPanelId}
                >
                  <SidePanelWithServices
                    side="right"
                    isExpanded={!rightPanelClosedState}
                    servicesManager={servicesManager}
                    expandedWidth={rightPanelExpandedWidth}
                    collapsedWidth={sidePanelCollapsedWidth}
                    collapsedInsideBorderSize={sidePanelCollapsedInsideBorderSize}
                    collapsedOutsideBorderSize={sidePanelCollapsedOutsideBorderSize}
                    expandedInsideBorderSize={sidePanelExpandedInsideBorderSize}
                    onClose={onRightPanelClose}
                    onOpen={onRightPanelOpen}
                  />
                </ResizablePanel>
              </>
            ) : null}
          </ResizablePanelGroup>
        </React.Fragment>
      </div>
      <Onboarding />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
    </div>
  );
}

ViewerLayout.propTypes = {
  // From extension module params
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object.isRequired,
  // From modes
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  leftPanelClosed: PropTypes.bool.isRequired,
  rightPanelClosed: PropTypes.bool.isRequired,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  viewports: PropTypes.array,
};

export default ViewerLayout;
