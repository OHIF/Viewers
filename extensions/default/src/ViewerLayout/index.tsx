import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { InvestigationalUseDialog } from '@ohif/ui-next';
import { HangingProtocolService, CommandsManager } from '@ohif/core';
import { useAppConfig } from '@state';
import ViewerHeader from './ViewerHeader';
import SidePanelWithServices from '../Components/SidePanelWithServices';
import {
  Icons,
  Onboarding,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@ohif/ui-next';
import useResizablePanels from './ResizablePanelsHook';

const resizableHandleClassName = 'mt-[1px] bg-background';

// MOB-02: evaluated once at module load — orientation flips mid-session are
// intentionally ignored for v1 (no resize listener).
const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

// MIMPS: remember the radiologist's right-panel collapse choice across studies.
// The mode default is open (so the AI findings panel is discoverable); once a
// user manually collapses or re-opens the panel that choice is persisted and
// overrides the default on subsequent loads. Desktop only — phones always start
// with side panels closed (MOB-02), so we never read/write the pref there.
const RIGHT_PANEL_PREF_KEY = 'blackvoxel:viewer:rightPanelClosed';

const readRightPanelPref = (): boolean | null => {
  try {
    const stored = window.localStorage.getItem(RIGHT_PANEL_PREF_KEY);
    return stored === null ? null : stored === 'true';
  } catch {
    // Private-mode / storage-disabled browsers: fall back to the mode default.
    return null;
  }
};

const writeRightPanelPref = (closed: boolean): void => {
  try {
    window.localStorage.setItem(RIGHT_PANEL_PREF_KEY, String(closed));
  } catch {
    /* storage unavailable — preference simply won't persist */
  }
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
  leftPanelInitialExpandedWidth,
  rightPanelInitialExpandedWidth,
  leftPanelMinimumExpandedWidth,
  rightPanelMinimumExpandedWidth,
}: withAppTypes): React.FunctionComponent {
  const [appConfig] = useAppConfig();

  const { panelService, hangingProtocolService, customizationService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const hasPanels = useCallback(
    (side): boolean => !!panelService.getPanels(side).length,
    [panelService]
  );

  const [hasRightPanels, setHasRightPanels] = useState(hasPanels('right'));
  const [hasLeftPanels, setHasLeftPanels] = useState(hasPanels('left'));
  // MOB-02 (V5): side panels default-closed on phones — a 280px expanded panel
  // leaves ~110px of image at 390px. The collapsed ~28px tab rail remains.
  const [mobileLayout] = useState(isMobile);
  const initialLeftPanelClosed = leftPanelClosed || mobileLayout;
  // MIMPS: on desktop, a remembered collapse/expand choice wins over the mode
  // default; with no stored pref we fall back to the mode's `rightPanelClosed`.
  const [rememberedRightClosed] = useState<boolean | null>(() =>
    mobileLayout ? null : readRightPanelPref()
  );
  const initialRightPanelClosed = mobileLayout
    ? true
    : rememberedRightClosed ?? rightPanelClosed;
  const [leftPanelClosedState, setLeftPanelClosed] = useState(initialLeftPanelClosed);
  const [rightPanelClosedState, setRightPanelClosed] = useState(initialRightPanelClosed);

  // MIMPS: persist the right-panel open/closed state so it survives study
  // navigation and reloads. Desktop only — we never overwrite the saved
  // desktop pref with the phone's force-closed layout (MOB-02).
  useEffect(() => {
    if (mobileLayout) {
      return;
    }
    writeRightPanelPref(rightPanelClosedState);
  }, [rightPanelClosedState, mobileLayout]);
  // MOB-02 (V6): AI/right-panel bottom sheet state (mobile only).
  const [mobileSheet, setMobileSheet] = useState<'closed' | 'peek' | 'full'>('closed');
  // MOB-04: swipe on the sheet header — down snaps full→peek→closed, up
  // snaps peek→full. Discrete snap on touchend only; no gesture library.
  const sheetTouchStartY = useRef<number | null>(null);
  const onSheetTouchStart = useCallback((e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
  }, []);
  const onSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) {
      return;
    }
    const deltaY = e.changedTouches[0].clientY - sheetTouchStartY.current;
    sheetTouchStartY.current = null;
    if (deltaY > 48) {
      setMobileSheet(s => (s === 'full' ? 'peek' : 'closed'));
    } else if (deltaY < -48) {
      setMobileSheet('full');
    }
  }, []);

  const [
    leftPanelProps,
    rightPanelProps,
    resizablePanelGroupProps,
    resizableLeftPanelProps,
    resizableViewportGridPanelProps,
    resizableRightPanelProps,
    onHandleDragging,
  ] = useResizablePanels(
    // MOB-02 (V5): the hook expands initially-open panels on first render, so
    // it must see the mobile-adjusted initial values, not the raw mode props.
    initialLeftPanelClosed,
    setLeftPanelClosed,
    initialRightPanelClosed,
    setRightPanelClosed,
    hasLeftPanels,
    hasRightPanels,
    leftPanelInitialExpandedWidth,
    rightPanelInitialExpandedWidth,
    leftPanelMinimumExpandedWidth,
    rightPanelMinimumExpandedWidth
  );

  const handleMouseEnter = () => {
    (document.activeElement as HTMLElement)?.blur();
  };

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  /**
   * Set body classes (tailwindcss) that don't allow vertical
   * or horizontal overflow (no scrolling). Also guarantee window
   * is sized to our viewport.
   */
  useEffect(() => {
    document.body.classList.add('bg-background');
    document.body.classList.add('overflow-hidden');

    return () => {
      document.body.classList.remove('bg-background');
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

    return { entry };
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
      isReferenceViewable: entry.isReferenceViewable,
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

  // MOB-02 (V6): on phones the 280px right side panel would bury the image, so
  // the first right panel (the AI findings panel in this fork) renders inside a
  // bottom sheet instead. Other right panels on mobile are deferred.
  const mobileRightPanel = mobileLayout && hasRightPanels ? panelService.getPanels('right')[0] : null;
  const MobileRightPanelContent = mobileRightPanel?.content as React.ComponentType | undefined;

  return (
    // MOB-02 (V4): flex column with dvh replaces the former fixed-height
    // `calc(100vh - 52px` scheme (missing paren, and 100vh breaks under the
    // iOS Safari URL bar). Flex absorbs the variable header height with no math.
    <div className="flex h-[100dvh] flex-col">
      <ViewerHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div className="relative flex min-h-0 w-full flex-1 flex-row flex-nowrap items-stretch overflow-hidden bg-background">
        <React.Fragment>
          {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-background" />}
          {/* MOB-04: on phones the left panel lives outside the resizable group —
              the collapsed ~28px tab rail stays in the flex row, and the expanded
              panel overlays the viewport (absolute) instead of squeezing the flex
              row down to ~85px of image. */}
          {hasLeftPanels && mobileLayout ? (
            <div
              className={classNames(
                'flex h-full shrink-0',
                !leftPanelClosedState && 'absolute inset-y-0 left-0 z-20 shadow-lg'
              )}
            >
              <SidePanelWithServices
                side="left"
                servicesManager={servicesManager}
                {...leftPanelProps}
                isExpanded={!leftPanelClosedState}
                onOpen={() => setLeftPanelClosed(false)}
                onClose={() => setLeftPanelClosed(true)}
              />
            </div>
          ) : null}
          <ResizablePanelGroup {...resizablePanelGroupProps}>
            {/* LEFT SIDEPANELS */}
            {hasLeftPanels && !mobileLayout ? (
              <>
                <ResizablePanel {...resizableLeftPanelProps}>
                  <SidePanelWithServices
                    side="left"
                    isExpanded={!leftPanelClosedState}
                    servicesManager={servicesManager}
                    {...leftPanelProps}
                  />
                </ResizablePanel>
                <ResizableHandle
                  onDragging={onHandleDragging}
                  disabled={!leftPanelResizable}
                  className={resizableHandleClassName}
                />
              </>
            ) : null}
            {/* TOOLBAR + GRID */}
            <ResizablePanel {...resizableViewportGridPanelProps}>
              <div className="flex h-full flex-1 flex-col">
                <div
                  className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-background"
                  onMouseEnter={handleMouseEnter}
                >
                  <ViewportGridComp
                    servicesManager={servicesManager}
                    viewportComponents={viewportComponents}
                    commandsManager={commandsManager}
                  />
                </div>
              </div>
            </ResizablePanel>
            {/* MOB-02 (V6): right panels never join the flex row on phones —
                the first one renders in the bottom sheet below instead. */}
            {hasRightPanels && !mobileLayout ? (
              <>
                <ResizableHandle
                  onDragging={onHandleDragging}
                  disabled={!rightPanelResizable}
                  className={resizableHandleClassName}
                />
                <ResizablePanel {...resizableRightPanelProps}>
                  <SidePanelWithServices
                    side="right"
                    isExpanded={!rightPanelClosedState}
                    servicesManager={servicesManager}
                    {...rightPanelProps}
                  />
                </ResizablePanel>
              </>
            ) : null}
          </ResizablePanelGroup>
        </React.Fragment>
      </div>
      {/* MOB-02 (V6): mobile bottom sheet for the AI findings panel — FAB
          trigger, 60dvh peek / 92dvh expanded, tap-to-dismiss scrim. The sheet
          stays mounted once the layout exists so panel state (inference
          results) survives open/close. */}
      {mobileRightPanel && MobileRightPanelContent ? (
        <>
          <button
            type="button"
            className="bg-highlight text-background fixed bottom-4 right-4 z-30 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-lg"
            onClick={() => setMobileSheet('peek')}
            aria-label={mobileRightPanel.label}
          >
            IA
          </button>
          {mobileSheet !== 'closed' && (
            <div
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setMobileSheet('closed')}
              aria-hidden="true"
            />
          )}
          <div
            role="dialog"
            aria-label={mobileRightPanel.label}
            className={classNames(
              'border-input bg-popover fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t transition-[height] duration-200',
              mobileSheet === 'closed' && 'hidden',
              mobileSheet === 'full' ? 'h-[92dvh]' : 'h-[60dvh]'
            )}
          >
            {/* MOB-04: swipe surface = handle + header row only, so it never
                competes with the scrollable body. touch-none stops the browser
                interpreting the drag as scroll/pull-to-refresh. */}
            <div
              className="touch-none"
              onTouchStart={onSheetTouchStart}
              onTouchEnd={onSheetTouchEnd}
            >
              <div
                className="mx-auto mt-2 h-1 w-9 rounded-full bg-white/20"
                aria-hidden="true"
              />
              <div className="flex items-center pl-4 pr-2">
                <span className="text-foreground flex-1 text-sm font-semibold">
                  {mobileRightPanel.label}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-2.5"
                  onClick={() => setMobileSheet(s => (s === 'full' ? 'peek' : 'full'))}
                  aria-label={mobileSheet === 'full' ? 'Recolher painel' : 'Expandir painel'}
                >
                  <Icons.ChevronOpen className={mobileSheet === 'full' ? '' : 'rotate-180'} />
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-2.5"
                  onClick={() => setMobileSheet('closed')}
                  aria-label="Fechar painel"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <MobileRightPanelContent />
            </div>
          </div>
        </>
      ) : null}
      <Onboarding tours={customizationService.getCustomization('ohif.tours')} />
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
