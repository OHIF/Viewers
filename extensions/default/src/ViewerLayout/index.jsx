import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { SidePanel, ErrorBoundary } from '@ohif/ui';
import Header from './Header.jsx';
import NestedMenu from './ToolbarButtonNestedMenu.jsx';

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  commandsManager,
  // From Modes
  leftPanels,
  rightPanels,
  viewports,
  children,
  ViewportGridComp,
}) {
  const { ToolBarService } = servicesManager.services;

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

  const defaultTool = { icon: 'tool-more-menu', label: 'More', isActive: false };
  const [toolbars, setToolbars] = useState({ primary: [], secondary: [] });
  const [activeTool, setActiveTool] = useState(defaultTool);

  const setActiveToolHandler = (tool, isNested) => {
    setActiveTool(isNested ? tool : defaultTool);
  };

  const onPrimaryClickHandler = (evt, btn) => {
    if (btn.props && btn.props.commands && evt.value && btn.props.commands[evt.value]) {
      const { commandName, commandOptions } = btn.props.commands[evt.value];
      commandsManager.runCommand(commandName, commandOptions);
    }
  };

  useEffect(() => {
    const { unsubscribe } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_MODIFIED,
      () => {
        console.warn('~~~ TOOL BAR MODIFIED EVENT CAUGHT');
        const updatedToolbars = {
          primary: ToolBarService.getButtonSection('primary', { onClick: onPrimaryClickHandler, setActiveTool: setActiveToolHandler }),
          secondary: ToolBarService.getButtonSection('secondary', { setActiveTool: setActiveToolHandler }),
        };
        setToolbars(updatedToolbars);
      }
    );

    return unsubscribe;
  }, [ToolBarService]);

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <Header>
        <ErrorBoundary context="Primary Toolbar">
          <div className="relative flex justify-center">
            {toolbars.primary.map(toolDef => {
              const isNested = Array.isArray(toolDef);
              if (!isNested) {
                const { id, Component, componentProps } = toolDef;
                return <Component key={id} id={id} {...componentProps} />;
              } else {
                return (
                  <NestedMenu isActive={activeTool.isActive} icon={activeTool.icon} label={activeTool.label}>
                    <div className="flex">
                      {toolDef.map(x => {
                        const { id, Component, componentProps } = x;
                        return <Component key={id} id={id} {...componentProps} />;
                      })}
                    </div>
                  </NestedMenu>
                );
              }
            })}
          </div>
        </ErrorBoundary>
      </Header>
      <div
        className="flex flex-row flex-no-wrap items-stretch w-full overflow-hidden"
        style={{ height: 'calc(100vh - 57px' }}
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
          <div className="flex h-12 border-b border-transparent flex-2 w-100">
            <ErrorBoundary context="Secondary Toolbar">
              <div className="flex items-center w-full px-3 bg-primary-dark">
                {toolbars.secondary.map(toolDef => {
                  const { id, Component, componentProps } = toolDef;
                  return <Component key={id} id={id} {...componentProps} />;
                })}
              </div>
            </ErrorBoundary>
          </div>
          <div className="flex items-center justify-center flex-1 h-full pt-1 pb-2 overflow-hidden bg-black">
            <ErrorBoundary context="Grid">
              <ViewportGridComp
                servicesManager={servicesManager}
                viewportComponents={viewportComponents}
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
  children: PropTypes.oneOfType(PropTypes.node, PropTypes.func).isRequired,
};

ViewerLayout.defaultProps = {
  leftPanels: [],
  rightPanels: [],
};

export default ViewerLayout;
