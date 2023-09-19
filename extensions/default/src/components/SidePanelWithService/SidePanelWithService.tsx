import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { SidePanel } from '@ohif/ui';
import { PanelService, ServicesManager, Types } from '@ohif/core';

const SidePanelWithService = ({
  servicesManager,
  side,
  activeTabIndex: activeTabIndexProp,
  tabs: tabsProp,
  ...props
}) => {
  // Tracks whether this SidePanel has been opened at least once since this SidePanel was inserted into the DOM.
  // Thus going to the Study List page and back to the viewer resets this flag for a SidePanel.
  const [hasBeenOpened, setHasBeenOpened] = useState(activeTabIndexProp !== null);

  const panelService: PanelService = servicesManager.services.panelService;
  const [tabs, setTabs] = useState(tabsProp ?? panelService.getPanels(side));
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);

  const handleSidePanelOpen = useCallback(() => {
    setHasBeenOpened(true);
  }, []);

  const handleActiveTabIndexChange = useCallback(({ activeTabIndex }) => {
    setActiveTabIndex(activeTabIndex);
  }, []);

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
        if (!hasBeenOpened || activatePanelEvent.forceActive) {
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
  }, [tabs, hasBeenOpened, panelService]);

  return (
    <SidePanel
      {...props}
      side={side}
      tabs={tabs}
      activeTabIndex={activeTabIndex}
      onSidePanelOpen={handleSidePanelOpen}
      onActiveTabIndexChange={handleActiveTabIndexChange}
    />
  );
};

SidePanelWithService.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager),
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  activeTabIndex: PropTypes.number,
  tabs: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        iconName: PropTypes.string.isRequired,
        iconLabel: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
      })
    ),
  ]),
};

export default SidePanelWithService;
