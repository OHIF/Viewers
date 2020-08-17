import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { SidePanel, ErrorBoundary, SplitButton, WindowLevelMenuItem } from '@ohif/ui';
import Header from './Header.jsx';
import NestedMenu from './ToolbarButtonNestedMenu.jsx';

// TODO: Having ToolbarPrimary and ToolbarSecondary is ugly, but
// these are going to be unified shortly so this is good enough for now.
function ToolbarPrimary({servicesManager}) {
  const { ToolBarService } = servicesManager.services;
  const defaultTool = {
    icon: 'tool-more-menu',
    label: 'More',
    isActive: false,
  };
  const [toolbars, setToolbars] = useState({ primary: [], secondary: [] });
  const [activeTool, setActiveTool] = useState(defaultTool);

  const setActiveToolHandler = (tool, isNested) => {
    setActiveTool(isNested ? tool : defaultTool);
  };

  const onPrimaryClickHandler = (evt, btn) => {
    if (
      btn.props &&
      btn.props.commands &&
      evt.value &&
      btn.props.commands[evt.value]
    ) {
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
          primary: ToolBarService.getButtonSection('primary', {
            onClick: onPrimaryClickHandler,
            setActiveTool: setActiveToolHandler,
          }),
          secondary: ToolBarService.getButtonSection('secondary', {
            setActiveTool: setActiveToolHandler,
          }),
        };
        setToolbars(updatedToolbars);
      }
    );

    return unsubscribe;
  }, [ToolBarService]);

  return <>
    {toolbars.primary.map((toolDef, index) => {
      const isNested = Array.isArray(toolDef);
      if (!isNested) {
        const { id, Component, componentProps } = toolDef;
        return <Component key={id} id={id} {...componentProps} />;
      } else {
        return (
          <NestedMenu
            key={index}
            isActive={activeTool.isActive}
            icon={activeTool.icon}
            label={activeTool.label}
          >
            <div className="flex">
              {toolDef.map(x => {
                const { id, Component, componentProps } = x;
                return (
                  <Component key={id} id={id} {...componentProps} />
                );
              })}
            </div>
          </NestedMenu>
        );
      }
    })}
  </>
}

function ToolbarSecondary({servicesManager}) {
  const { ToolBarService } = servicesManager.services;
  const defaultTool = {
    icon: 'tool-more-menu',
    label: 'More',
    isActive: false,
  };
  const [toolbars, setToolbars] = useState({ primary: [], secondary: [] });
  const [activeTool, setActiveTool] = useState(defaultTool);

  const setActiveToolHandler = (tool, isNested) => {
    setActiveTool(isNested ? tool : defaultTool);
  };

  const onPrimaryClickHandler = (evt, btn) => {
    if (
      btn.props &&
      btn.props.commands &&
      evt.item && evt.item.value &&
      btn.props.commands[evt.item.value]
    ) {
      const { commandName, commandOptions } = btn.props.commands[evt.item.value];
      commandsManager.runCommand(commandName, commandOptions);
    }
  };

  useEffect(() => {
    const { unsubscribe } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_MODIFIED,
      () => {
        console.warn('~~~ TOOL BAR MODIFIED EVENT CAUGHT');
        const updatedToolbars = {
          primary: ToolBarService.getButtonSection('primary', {
            onClick: onPrimaryClickHandler,
            setActiveTool: setActiveToolHandler,
          }),
          secondary: ToolBarService.getButtonSection('secondary', {
            setActiveTool: setActiveToolHandler,
          }),
        };
        setToolbars(updatedToolbars);
      }
    );

    return unsubscribe;
  }, [ToolBarService]);

  return <>
    {toolbars.secondary.map(toolDef => {
      const { id, Component, componentProps } = toolDef;
      return <Component key={id} id={id} {...componentProps} />;
    })}
  </>
}


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

  const mockedProps = {
    primary: {
      tooltip: 'W/L',
      icon: 'tool-window-level',
      onClick: (args) => console.debug('Primary click!', args)
    },
    secondary: {
      icon: 'chevron-down',
      label: '',
      isActive: true,
      tooltip: 'More Measure Tools',
    },
    items: [
      { icon: 'tool-layout', label: 'Layout', onClick: (args) => console.debug('Item click!', args) },
      { icon: 'tool-window-level', label: 'W/L', onClick: (args) => console.debug('Item click!', args) },
      { icon: 'tool-length', label: 'Length', onClick: (args) => console.debug('Item click!', args) }
    ],
    onClick: (args) => console.debug('Any click!', args)
  };

  return (
    <div>
      <Header>
        <ErrorBoundary context="Primary Toolbar">
          <SplitButton {...mockedProps} isRadio />
          <SplitButton {...mockedProps} isAction renderer={WindowLevelMenuItem} items={[
            { value: 1, title: 'Soft tissue', subtitle: '400 / 40' },
            { value: 2, title: 'Lung', subtitle: '1500 / -600' },
            { value: 3, title: 'Liver', subtitle: '150 / 90' },
            { value: 4, title: 'Bone', subtitle: '80 / 40' },
            { value: 5, title: 'Brain', subtitle: '2500 / 480' },
          ]} />
          <SplitButton {...mockedProps} />
          <div className="relative flex justify-center">
            <ToolbarPrimary servicesManager={servicesManager}/>
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
                <ToolbarSecondary servicesManager={servicesManager}/>
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
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

ViewerLayout.defaultProps = {
  leftPanels: [],
  rightPanels: [],
};

export default ViewerLayout;
