import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { SidePanel } from '@ohif/ui';
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

  const [toolbars, setToolbars] = useState({ primary: [], secondary: [] });

  useEffect(() => {
    const { unsubscribe } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_MODIFIED,
      () => {
        console.warn('~~~ TOOL BAR MODIFIED EVENT CAUGHT');
        const updatedToolbars = {
          primary: ToolBarService.getButtonSection('primary'),
          secondary: ToolBarService.getButtonSection('secondary'),
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
        <div className="relative flex justify-center">
          {toolbars.primary.map(toolDef => {
            const isNested = Array.isArray(toolDef);

            if (!isNested) {
              const { id, Component, componentProps } = toolDef;

              return <Component key={id} id={id} {...componentProps} />;
            } else {
              return (
                <NestedMenu>
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
      </Header>
      <div
        className="flex flex-row flex-no-wrap items-stretch w-full overflow-hidden"
        style={{ height: 'calc(100vh - 57px' }}
      >
        {/* LEFT SIDEPANELS */}
        {leftPanelComponents.length && (
          <SidePanel
            side="left"
            defaultComponentOpen={leftPanelComponents[0].name}
            childComponents={leftPanelComponents}
          />
        )}
        {/* TOOLBAR + GRID */}
        <div className="flex flex-col flex-1 h-full">
          <div className="flex h-12 border-b border-transparent flex-2 w-100">
            <div className="flex items-center w-full px-3 bg-primary-dark">
              {toolbars.secondary.map(toolDef => {
                const { id, Component, componentProps } = toolDef;

                return <Component key={id} id={id} {...componentProps} />;
              })}
            </div>
          </div>
          <div className="flex items-center justify-center flex-1 h-full pt-1 pb-2 overflow-hidden bg-black">
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
            />
          </div>
        </div>
        {rightPanelComponents.length && (
          <SidePanel
            side="right"
            defaultComponentOpen={rightPanelComponents[0].name}
            childComponents={rightPanelComponents}
          />
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
