import React, { useEffect, useState, useCallback } from 'react';
import { SidePanel } from '@ohif/ui-next';
import { Types } from '@ohif/core';

export type SidePanelWithServicesProps = {
  servicesManager: AppTypes.ServicesManager;
  side: 'left' | 'right';
  className?: string;
  activeTabIndex: number;
  tabs?: any;
  expandedWidth?: number;
  onClose: () => void;
  onOpen: () => void;
  isExpanded: boolean;
  collapsedWidth?: number;
  expandedInsideBorderSize?: number;
  collapsedInsideBorderSize?: number;
  collapsedOutsideBorderSize?: number;
};

const SidePanelWithServices = ({
  servicesManager,
  side,
  activeTabIndex: activeTabIndexProp,
  isExpanded,
  tabs: tabsProp,
  onOpen,
  onClose,
  ...props
}: SidePanelWithServicesProps) => {
  const panelService = servicesManager?.services?.panelService;

  // Tracks whether this SidePanel has been opened at least once since this SidePanel was inserted into the DOM.
  // Thus going to the Study List page and back to the viewer resets this flag for a SidePanel.
  const [sidePanelExpanded, setSidePanelExpanded] = useState(isExpanded);
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp ?? 0);
  const [closedManually, setClosedManually] = useState(false);
  const [tabs, setTabs] = useState(tabsProp ?? panelService.getPanels(side));

  const handleActiveTabIndexChange = useCallback(({ activeTabIndex }) => {
    setActiveTabIndex(activeTabIndex);
  }, []);

  const handleOpen = useCallback(() => {
    setSidePanelExpanded(true);
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setSidePanelExpanded(false);
    setClosedManually(true);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    setSidePanelExpanded(isExpanded);
  }, [isExpanded]);

  /** update the active tab index from outside */
  useEffect(() => {
    setActiveTabIndex(activeTabIndexProp ?? 0);
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
        if (sidePanelExpanded || activatePanelEvent.forceActive) {
          const tabIndex = tabs.findIndex(tab => tab.id === activatePanelEvent.panelId);
          if (tabIndex !== -1) {
            if (!closedManually) {
              setSidePanelExpanded(true);
            }
            setActiveTabIndex(tabIndex);
          }
        }
      }
    );

    return () => {
      activatePanelSubscription.unsubscribe();
    };
  }, [tabs, sidePanelExpanded, panelService, closedManually]);

  return (
    <SidePanel
      {...props}
      side={side}
      tabs={tabs}
      activeTabIndex={activeTabIndex}
      isExpanded={sidePanelExpanded}
      onOpen={handleOpen}
      onClose={handleClose}
      onActiveTabIndexChange={handleActiveTabIndexChange}
    />
  );
};

export default SidePanelWithServices;
