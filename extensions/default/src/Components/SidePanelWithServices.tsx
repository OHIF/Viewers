import React, { useEffect, useState, useCallback } from 'react';
import { SidePanel } from '@ohif/ui-next';
import { Types } from '@ohif/core';

export type SidePanelWithServicesProps = {
  servicesManager: AppTypes.ServicesManager;
  side: 'left' | 'right';
  className?: string;
  activeTabIndex: number;
  tabs: any;
  expandedWidth?: number;
};

const SidePanelWithServices = ({
  servicesManager,
  side,
  activeTabIndex: activeTabIndexProp,
  tabs: tabsProp,
  expandedWidth,
  ...props
}: SidePanelWithServicesProps) => {
  const panelService = servicesManager?.services?.panelService;

  // Tracks whether this SidePanel has been opened at least once since this SidePanel was inserted into the DOM.
  // Thus going to the Study List page and back to the viewer resets this flag for a SidePanel.
  const [sidePanelOpen, setSidePanelOpen] = useState(activeTabIndexProp !== null);
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);
  const [tabs, setTabs] = useState(tabsProp ?? panelService.getPanels(side));

  const handleActiveTabIndexChange = useCallback(({ activeTabIndex }) => {
    setActiveTabIndex(activeTabIndex);
    setSidePanelOpen(activeTabIndex !== null);
  }, []);

  const handleOpen = useCallback(() => {
    setSidePanelOpen(true);
    // If panel is being opened but no tab is active, set first tab as active
    if (activeTabIndex === null && tabs.length > 0) {
      setActiveTabIndex(0);
    }
  }, [activeTabIndex, tabs]);

  const handleClose = useCallback(() => {
    setSidePanelOpen(false);
    setActiveTabIndex(null);
  }, []);

  /** update the active tab index from outside */
  useEffect(() => {
    setActiveTabIndex(activeTabIndexProp);
  }, [activeTabIndexProp]);

  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(
      panelService.EVENTS.PANELS_CHANGED,
      panelChangedEvent => {
        if (panelChangedEvent.position !== side) {
          return;
        }

        setTabs(panelService.getPanels(side));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [panelService, side]);

  useEffect(() => {
    const activatePanelSubscription = panelService.subscribe(
      panelService.EVENTS.ACTIVATE_PANEL,
      (activatePanelEvent: Types.ActivatePanelEvent) => {
        if (sidePanelOpen || activatePanelEvent.forceActive) {
          const tabIndex = tabs.findIndex(tab => tab.id === activatePanelEvent.panelId);
          if (tabIndex !== -1) {
            setActiveTabIndex(tabIndex);
          }
        }
      }
    );

    return () => {
      activatePanelSubscription.unsubscribe();
    };
  }, [tabs, sidePanelOpen, panelService]);

  return (
    <SidePanel
      {...props}
      side={side}
      tabs={tabs}
      activeTabIndex={activeTabIndex}
      onOpen={handleOpen}
      onClose={handleClose}
      onActiveTabIndexChange={handleActiveTabIndexChange}
      expandedWidth={expandedWidth}
    />
  );
};

export default SidePanelWithServices;
