import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SidePanel, Toolbar } from '@ohif/ui';
//
import Header from './Header.jsx';

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

  const handleToolBarSubscription = newToolBarLayout => {
    // Get buttons to pass to toolbars.
    console.log(commandsManager);

    const firstTool = newToolBarLayout[0].tools[0];

    const toolBarLayout = [];

    newToolBarLayout.forEach(newToolBar => {
      const toolBar = { tools: [], moreTools: [] };

      Object.keys(newToolBar).forEach(key => {
        if (newToolBar[key].length) {
          newToolBar[key].forEach(tool => {
            const commandOptions = tool.commandOptions || {};

            toolBar[key].push({
              context: tool.context,
              icon: tool.icon,
              id: tool.id,
              label: tool.label,
              type: 'setToolActive',
              onClick: () => {
                commandsManager.runCommand(tool.commandName, commandOptions);
              },
            });
          });
        }
      });

      toolBarLayout.push(toolBar);

      // if (newToolBar.moreTools && newToolBar.moreTools.length) {
      //   newToolBar.moreTools.forEach(tool => {
      //     const commandOptions = tool.commandOptions || {};

      //     toolBar.push({
      //       context: tool.context,
      //       icon: tool.icon,
      //       id: tool.id,
      //       label: tool.label,
      //       type: 'setToolActive',
      //       command: () =>
      //         commandsManager.runCommand(tool.commandName, commandOptions),
      //     });
      //   });
      // }
    });

    setToolBarLayout(toolBarLayout);
  };

  const [toolBarLayout, setToolBarLayout] = useState([
    { tools: [], moreTools: [] },
    { tools: [] },
  ]);

  useEffect(() => {
    const { unsubscribe } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_MODIFIED,
      handleToolBarSubscription
    );

    return unsubscribe;
  }, []);

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <Header
        tools={toolBarLayout[0].tools}
        moreTools={toolBarLayout[0].moreTools}
      />
      <div
        className="flex flex-row flex-no-wrap items-stretch w-full overflow-hidden"
        style={{ height: 'calc(100vh - 57px' }}
      >
        {/* LEFT SIDEPANELS */}
        <SidePanel
          side="left"
          defaultComponentOpen={leftPanelComponents[0].name}
          childComponents={leftPanelComponents}
        />
        {/* TOOLBAR + GRID */}
        <div className="flex flex-col flex-1 h-full">
          <div className="flex h-12 border-b border-transparent flex-2 w-100">
            <Toolbar type="secondary" tools={toolBarLayout[1].tools} />
          </div>
          <div className="flex items-center justify-center flex-1 h-full pt-1 pb-2 overflow-hidden bg-black">
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
            />
            {/*
              viewportContents={[
                <Viewport
                  viewportIndex={0}
                  onSeriesChange={direction => alert(`Series ${direction}`)}
                  studyData={{
                    label: 'A',
                    isTracked: true,
                    isLocked: false,
                    studyDate: '07-Sep-2011',
                    currentSeries: 1,
                    seriesDescription:
                      'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
                    modality: 'CT',
                    patientInformation: {
                      patientName: 'Smith, Jane',
                      patientSex: 'F',
                      patientAge: '59',
                      MRN: '10000001',
                      thickness: '5.0mm',
                      spacing: '1.25mm',
                      scanner: 'Aquilion',
                    },
                  }}
                >
                </Viewport>,
                <Viewport
                  viewportIndex={1}
                  onSeriesChange={direction => alert(`Series ${direction}`)}
                  studyData={{
                    label: 'A',
                    isTracked: false,
                    isLocked: true,
                    studyDate: '07-Sep-2010',
                    currentSeries: 2,
                    seriesDescription:
                      'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
                    modality: 'SR',
                    patientInformation: {
                      patientName: 'Smith, Jane',
                      patientSex: 'F',
                      patientAge: '59',
                      MRN: '10000001',
                      thickness: '2.0mm',
                      spacing: '1.25mm',
                      scanner: 'Aquilion',
                    },
                  }}
                >
                </Viewport>,
              ]}
              setActiveViewportIndex={setActiveViewportIndex}
              activeViewportIndex={activeViewportIndex}
            />*/}
          </div>
        </div>
        <SidePanel
          side="right"
          defaultComponentOpen={rightPanelComponents[0].name}
          childComponents={rightPanelComponents}
        />
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
  // TODO: Not in love with this shape,
  toolBarLayout: PropTypes.arrayOf(
    PropTypes.shape({
      tools: PropTypes.array,
      moreTools: PropTypes.array,
    })
  ).isRequired,
  //displaySetInstanceUids: PropTypes.any.isRequired,
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  children: PropTypes.oneOfType(PropTypes.node, PropTypes.func).isRequired,
};

export default ViewerLayout;
