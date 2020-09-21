import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  SidePanel,
  ErrorBoundary,
  UserPreferences,
  AboutModal,
  Header,
  useModal,
} from '@ohif/ui';

function Toolbar({ servicesManager }) {
  const { ToolBarService } = servicesManager.services;
  const [toolbarButtons, setToolbarButtons] = useState([]);
  const [buttonState, setButtonState] = useState({
    primaryToolId: '',
    toggles: {},
    groups: {},
  });

  // Could track buttons and state separately...?
  useEffect(() => {
    const { unsubscribe: unsub1 } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_MODIFIED,
      () => setToolbarButtons(ToolBarService.getButtonSection('primary'))
    );
    const { unsubscribe: unsub2 } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => setButtonState({ ...ToolBarService.state })
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [ToolBarService]);

  return (
    <>
      {toolbarButtons.map((toolDef, index) => {
        const { id, Component, componentProps } = toolDef;
        // TODO: ...

        // isActive if:
        // - id is primary?
        // - id is in list of "toggled on"?

        // Also need... to filter list for splitButton, and set primary based on most recently clicked
        // Also need to kill the radioGroup button's magic logic
        // Everything should be reactive off these props, so commands can inform ToolbarService

        // These can... Trigger toolbar events based on updates?
        // Then sync using useEffect, or simply modify the state here?
        return (
          <Component
            key={id}
            id={id}
            {...componentProps}
            bState={buttonState}
            onInteraction={args => ToolBarService.recordInteraction(args)}
          />
        );
      })}
    </>
  );
}

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  // From Modes
  leftPanels,
  rightPanels,
  viewports,
  ViewportGridComp,
}) {
  const { t } = useTranslation();
  const { show, hide } = useModal();

  const { hotkeyDefinitions, hotkeyDefaults } = hotkeysManager;
  const menuOptions = [
    {
      title: t('Header:About'),
      icon: 'info',
      onClick: () => show({ content: AboutModal, title: 'About OHIF Viewer' }),
    },
    {
      title: t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          title: t('UserPreferencesModal:User Preferences'),
          content: UserPreferences,
          contentProps: {
            hotkeyDefaults: hotkeysManager.getValidHotkeyDefinitions(
              hotkeyDefaults
            ),
            hotkeyDefinitions,
            onCancel: hide,
            onSubmit: ({ hotkeyDefinitions }) => {
              hotkeysManager.setHotkeys(hotkeyDefinitions);
              hide();
            },
            onReset: () => hotkeysManager.restoreDefaultBindings(),
          },
        }),
    },
  ];

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

  const getPanelData = id => {
    const entry = extensionManager.getModuleEntry(id);
    // TODO, not sure why sidepanel content has to be JSX, and not a children prop?
    const content = entry.component;

    return {
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  };

  const getViewportComponentData = viewportComponent => {
    const entry = extensionManager.getModuleEntry(viewportComponent.namespace);

    return {
      component: entry.component,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <Header menuOptions={menuOptions}>
        <ErrorBoundary context="Primary Toolbar">
          <div className="relative flex justify-center">
            <Toolbar servicesManager={servicesManager} />
          </div>
        </ErrorBoundary>
      </Header>
      <div
        className="flex flex-row flex-no-wrap items-stretch w-full overflow-hidden"
        style={{ height: 'calc(100vh - 52px' }}
      >
        {/* LEFT SIDEPANELS */}
        {leftPanelComponents.length && (
          <ErrorBoundary context="Left Panel">
            <SidePanel
              side="left"
              defaultComponentOpen={leftPanelComponents[0].name}
              childComponents={leftPanelComponents}
            />
          </ErrorBoundary>
        )}
        {/* TOOLBAR + GRID */}
        <div className="flex flex-col flex-1 h-full">
          <div className="flex items-center justify-center flex-1 h-full -mt-1 overflow-hidden bg-black">
            <ErrorBoundary context="Grid">
              <ViewportGridComp
                servicesManager={servicesManager}
                viewportComponents={viewportComponents}
                commandsManager={commandsManager}
              />
            </ErrorBoundary>
          </div>
        </div>
        {rightPanelComponents.length && (
          <ErrorBoundary context="Right Panel">
            <SidePanel
              side="right"
              defaultComponentOpen={rightPanelComponents[0].name}
              childComponents={rightPanelComponents}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

ViewerLayout.propTypes = {
  // From extension module params
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  commandsManager: PropTypes.object,
  // From modes
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

ViewerLayout.defaultProps = {
  leftPanels: [],
  rightPanels: [],
};

export default ViewerLayout;
