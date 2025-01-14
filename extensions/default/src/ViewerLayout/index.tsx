import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { LoadingIndicatorProgress, InvestigationalUseDialog } from '@ohif/ui';
import { HangingProtocolService, CommandsManager } from '@ohif/core';
import { useAppConfig } from '@state';
import ViewerHeader from './ViewerHeader';
import SidePanelWithServices from '../Components/SidePanelWithServices';
import { Onboarding, ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ohif/ui-next';

// Id needed to grab the panel group for converting pixels to percentages
const viewerLayoutResizablePanelGroupId = 'viewerLayoutResizablePanelGroup';

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
  const [resizablePanelCollapsedSize, setResizablePanelCollapsedSize] = useState(0);
  const [resizablePanelDefaultSize, setResizablePanelDefaultSize] = useState(0);
  const [resizablePanelGroupElem, setResizablePanelGroupElem] = useState(null);
  const resizableLeftPanelRef = useRef(null);
  const resizableRightPanelRef = useRef(null);

  // This useLayoutEffect follows the pattern prescribed by the react-resizable-panels
  // readme for converting between pixel values and percentages. An example of
  // the pattern can be found here:
  // https://github.com/bvaughn/react-resizable-panels/issues/46#issuecomment-1368108416
  // This useLayoutEffect is used to...
  // - Grab a reference to the resizable panel group whose width is needed for
  //   converting to percentages in various callbacks.
  // - Expand those panels that are initially expanded.
  // - Add a resize observer to the resizable panel group to reset various state
  //   values whenever the resizable panel group is resized (e.g. whenever the
  //   browser window is resized).
  useLayoutEffect(() => {
    const panelGroup = document.querySelector(
      `[data-panel-group-id="${viewerLayoutResizablePanelGroupId}"]`
    );

    setResizablePanelGroupElem(panelGroup);
    const { width: panelGroupWidth } = panelGroup.getBoundingClientRect();

    const resizablePanelExpandedSize =
      (sidePanelExpandedDefaultOffsetWidth / panelGroupWidth) * 100;

    // Since both resizable panels are collapsed by default (i.e. their default size is zero),
    // on the very first render check if either/both side panels should be expanded.
    // If so, then check if there is space to expand either panel and expand them
    // with the appropriate size.
    if (!leftPanelClosed && resizablePanelExpandedSize <= 50) {
      resizableLeftPanelRef?.current?.expand(resizablePanelExpandedSize);
    }

    if (!rightPanelClosed && resizablePanelExpandedSize <= 50) {
      resizableRightPanelRef?.current?.expand(resizablePanelExpandedSize);
    }

    // This observer kicks in when the ViewportLayout resizable panel group
    // component is resized. This typically occurs when the browser window resizes.
    const observer = new ResizeObserver(() => {
      const { width: panelGroupWidth } = panelGroup.getBoundingClientRect();
      const defaultSize = (sidePanelExpandedDefaultOffsetWidth / panelGroupWidth) * 100;

      // Set the new default and collapsed resizable panel sizes.
      setResizablePanelDefaultSize(Math.min(50, defaultSize));
      setResizablePanelCollapsedSize((sidePanelCollapsedOffsetWidth / panelGroupWidth) * 100);

      if (resizableLeftPanelRef?.current && !resizableLeftPanelRef.current.isCollapsed()) {
        if (!leftPanelResizable) {
          // The panel is not resizable so resize to the default size.
          resizableLeftPanelRef.current.resize(defaultSize);
        } else {
          // The side panel is expanded. Check if there is enough space
          // to continue showing it expanded.
          const leftSize = resizableLeftPanelRef.current.getSize();
          if (leftSize < defaultSize) {
            // There is not enough space at the current size of the resizable panel.
            // Check if there is enough space in the resizable panel group.
            if (panelGroupWidth / 2 < sidePanelExpandedDefaultOffsetWidth) {
              // There is not enough space in the resizable panel group
              // so collapse the side panel.
              resizableLeftPanelRef.current.collapse();
            } else {
              // There is enough space in the resizable panel group so resize
              // the resizable panel that contains the side panel.
              resizableLeftPanelRef.current.resize(defaultSize);
            }
          } else {
            // It can stay expanded in the space the resizable panel has available,
            // just adjust its pixel width.
            setLeftPanelExpandedWidth(
              (leftSize / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize
            );
          }
        }
      }

      if (resizableRightPanelRef?.current && !resizableRightPanelRef.current.isCollapsed()) {
        if (!rightPanelResizable) {
          // The panel is not resizable so resize to the default size.
          resizableRightPanelRef.current.resize(defaultSize);
        } else {
          // The side panel is expanded. Check if there is enough space
          // to continue showing it expanded.
          const rightSize = resizableRightPanelRef.current.getSize();
          if (rightSize < defaultSize) {
            // There is not enough space at the current size of the resizable panel.
            // Check if there is enough space in the resizable panel group.
            if (panelGroupWidth / 2 < sidePanelExpandedDefaultOffsetWidth) {
              // There is not enough space in the resizable panel group
              // so collapse the side panel.
              resizableRightPanelRef.current.collapse();
            } else {
              // There is enough space in the resizable panel group so resize
              // the resizable panel that contains the side panel.
              resizableRightPanelRef.current.resize(defaultSize);
            }
          } else {
            // It can stay expanded in the space the resizable panel has available,
            // just adjust its pixel width.
            setRightPanelExpandedWidth(
              (rightSize / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize
            );
          }
        }
      }
    });
    observer.observe(panelGroup);

    return () => {
      observer.disconnect();
    };
  }, []); // needs to be performed only once prior to the very first render, so no dependencies

  const onLeftPanelClose = useCallback(() => {
    setLeftPanelClosed(true);
    resizableLeftPanelRef?.current?.collapse();
  }, []);

  const onLeftPanelOpen = useCallback(() => {
    resizableLeftPanelRef?.current?.expand();
    setLeftPanelClosed(false);
  }, []);

  const onLeftPanelResize = useCallback(() => {
    if (!resizablePanelGroupElem || resizableLeftPanelRef?.current?.isCollapsed()) {
      return;
    }
    const size = resizableLeftPanelRef?.current?.getSize();
    const { width: panelGroupWidth } = resizablePanelGroupElem.getBoundingClientRect();
    setLeftPanelExpandedWidth((size / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize);
  }, [resizablePanelGroupElem]);

  const onRightPanelClose = useCallback(() => {
    setRightPanelClosed(true);
    resizableRightPanelRef?.current?.collapse();
  }, []);

  const onRightPanelOpen = useCallback(() => {
    resizableRightPanelRef?.current?.expand();
    setRightPanelClosed(false);
  }, []);

  const onRightPanelResize = useCallback(() => {
    if (!resizablePanelGroupElem || resizableRightPanelRef?.current?.isCollapsed()) {
      return;
    }
    const size = resizableRightPanelRef?.current?.getSize();
    const { width: panelGroupWidth } = resizablePanelGroupElem.getBoundingClientRect();
    setRightPanelExpandedWidth((size / 100) * panelGroupWidth - sidePanelExpandedInsideBorderSize);
  }, [resizablePanelGroupElem]);

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
                  ref={resizableLeftPanelRef}
                  order={0}
                  id={'viewerLayoutResizableLeftPanel'}
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
                  ref={resizableRightPanelRef}
                  order={3}
                  id={'viewerLayoutResizableRightPanel'}
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
