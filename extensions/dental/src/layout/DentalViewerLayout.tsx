import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { CommandsManager, HangingProtocolService } from '@ohif/core';
import { InvestigationalUseDialog, Onboarding } from '@ohif/ui-next';
import { useAppConfig } from '@state';

import PracticeHeader from './PracticeHeader';
import SidePanelWithServices from './SidePanelWithServices';

function DentalViewerLayout({
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  viewports,
  ViewportGridComp,
  leftPanelClosed = false,
  rightPanelClosed = false,
  leftPanelInitialExpandedWidth,
  rightPanelInitialExpandedWidth,
}: withAppTypes): React.ReactElement {
  const [appConfig] = useAppConfig();
  const { panelService, hangingProtocolService, customizationService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  const hasPanels = useCallback((side): boolean => !!panelService.getPanels(side).length, [
    panelService,
  ]);

  const [hasRightPanels, setHasRightPanels] = useState(hasPanels('right'));
  const [hasLeftPanels, setHasLeftPanels] = useState(hasPanels('left'));
  const [leftPanelClosedState, setLeftPanelClosed] = useState(leftPanelClosed);
  const [rightPanelClosedState, setRightPanelClosed] = useState(rightPanelClosed);

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);

    if (!entry || !entry.component) {
      throw new Error(
        `${id} is not valid for an extension module or no component found from extension ${id}.`
      );
    }

    return { entry };
  };

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);

    return {
      component: entry.component,
      isReferenceViewable: entry.isReferenceViewable,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  useEffect(() => {
    document.body.classList.add('bg-background');
    document.body.classList.add('overflow-hidden');

    return () => {
      document.body.classList.remove('bg-background');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => {
        setShowLoadingIndicator(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

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
    <div data-cy="dental-viewer-layout">
      <PracticeHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div
        className="relative flex w-full flex-row flex-nowrap items-stretch overflow-hidden bg-background"
        style={{ height: 'calc(100vh - 56px)' }}
      >
        {showLoadingIndicator ? (
          <LoadingIndicatorProgress className="h-full w-full bg-background" />
        ) : null}
        <div className="flex h-full w-full flex-row overflow-hidden">
          {hasLeftPanels ? (
            <SidePanelWithServices
              side="left"
              isExpanded={!leftPanelClosedState}
              servicesManager={servicesManager}
              expandedWidth={leftPanelInitialExpandedWidth}
              onOpen={() => setLeftPanelClosed(false)}
              onClose={() => setLeftPanelClosed(true)}
            />
          ) : null}
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-background">
              <ViewportGridComp
                servicesManager={servicesManager}
                viewportComponents={viewportComponents}
                commandsManager={commandsManager}
              />
            </div>
          </div>
          {hasRightPanels ? (
            <SidePanelWithServices
              side="right"
              isExpanded={!rightPanelClosedState}
              servicesManager={servicesManager}
              expandedWidth={rightPanelInitialExpandedWidth}
              onOpen={() => setRightPanelClosed(false)}
              onClose={() => setRightPanelClosed(true)}
            />
          ) : null}
        </div>
      </div>
      <Onboarding tours={customizationService.getCustomization('ohif.tours')} />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
    </div>
  );
}

DentalViewerLayout.propTypes = {
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object.isRequired,
  viewports: PropTypes.array,
};

export default DentalViewerLayout;
