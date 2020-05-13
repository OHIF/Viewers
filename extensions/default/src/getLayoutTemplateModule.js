import React, { useState } from 'react';

import { SidePanel, NavBar, Svg, Icon, IconButton, Toolbar } from '@ohif/ui';
import {
  HelloWorldContext,
  AnotherHelloWorldContext,
} from './getContextModule';

export default function() {
  return [
    // Layout Template Definition
    // TODO: this is weird naming
    {
      name: 'viewerLayout',
      id: 'viewerLayout',
      component: viewerLayout,
    },
  ];
}

const Header = ({ tools, moreTools }) => {
  const [activeTool, setActiveTool] = useState('Zoom');
  const dropdownContent = [
    {
      name: 'Soft tissue',
      value: '400/40',
    },
    { name: 'Lung', value: '1500 / -600' },
    { name: 'Liver', value: '150 / 90' },
    { name: 'Bone', value: '2500 / 480' },
    { name: 'Brain', value: '80 / 40' },
  ];

  /*
  const tools = [
    {
      id: 'Zoom',
      label: 'Zoom',
      icon: 'tool-zoom',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      onClick: () => setActiveTool('Zoom'),
    },
    {
      id: 'Wwwc',
      label: 'Levels',
      icon: 'tool-window-level',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Wwwc' },
      onClick: () => setActiveTool('Wwwc'),
      dropdownContent: (
        <div>
          {dropdownContent.map((row, i) => (
            <div
              key={i}
              className="flex justify-between py-2 px-3 hover:bg-secondary-dark cursor-pointer"
            >
              <div>
                <span className="text-base text-white">{row.name}</span>
                <span className="text-base text-primary-light ml-3">
                  {row.value}
                </span>
              </div>
              <span className="text-base text-primary-active ml-4">{i}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'Pan',
      label: 'Pan',
      icon: 'tool-move',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      onClick: () => setActiveTool('Pan'),
    },
    {
      id: 'Capture',
      label: 'Capture',
      icon: 'tool-capture',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Capture' },
      onClick: () => setActiveTool('Capture'),
    },
    {
      id: 'Layout',
      label: 'Layout',
      icon: 'tool-layout',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Layout' },
      onClick: () => setActiveTool('Layout'),
    },
  ];
  */
  return (
    <NavBar className="justify-between border-b-4 border-black">
      <div className="flex flex-1 justify-between">
        <div className="flex items-center">
          <div className="mr-3 inline-flex items-center">
            <Icon
              name="chevron-left"
              className="text-primary-active w-8 cursor-pointer"
              onClick={() => alert('Navigate to previous page')}
            />
            <a href="#" className="ml-4">
              <Svg name="logo-ohif" />
            </a>
          </div>
        </div>
        <div className="flex items-center">
          <Toolbar
            tools={tools}
            activeTool={activeTool}
            moreTools={moreTools}
          />
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-common-light text-lg">
            FOR INVESTIGATIONAL USE ONLY
          </span>
          <IconButton
            variant="text"
            color="inherit"
            className="text-primary-active"
            onClick={() => {}}
          >
            <React.Fragment>
              <Icon name="settings" /> <Icon name="chevron-down" />
            </React.Fragment>
          </IconButton>
        </div>
      </div>
    </NavBar>
  );
};

const ViewportToolbar = ({ tools }) => {
  // const tools = [
  //   {
  //     id: 'Annotate',
  //     label: 'Annotate',
  //     icon: 'tool-annotate',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Annotate' },
  //     onClick: () => console.log('Activate Annotate'),
  //   },
  //   {
  //     id: 'Bidirectional',
  //     label: 'Bidirectional',
  //     icon: 'tool-bidirectional',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Bidirectional' },
  //     onClick: () => console.log('Activate Bidirectional'),
  //   },
  //   {
  //     id: 'Elipse',
  //     label: 'Elipse',
  //     icon: 'tool-elipse',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Elipse' },
  //     onClick: () => console.log('Activate Elipse'),
  //   },
  //   {
  //     id: 'Length',
  //     label: 'Length',
  //     icon: 'tool-length',
  //     type: null,
  //     commandName: 'setToolActive',
  //     commandOptions: { toolName: 'Length' },
  //     onClick: () => console.log('Activate Length'),
  //   },
  // ];
  return <Toolbar type="secondary" tools={tools} />;
};

function viewerLayout({
  leftPanels,
  rightPanels,
  extensionManager,
  toolBarLayout,
  displaySetInstanceUids,
}) {
  const getPanelData = id => {
    const entry = extensionManager.getModuleEntry(id);
    // TODO, not sure why sidepanel content has to be JSX, and not a children prop?
    const content = entry.component({});

    return {
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);

  console.warn(displaySetInstanceUids);
  console.warn(toolBarLayout);

  const [primaryToolBarLayout, secondaryToolBarLayout] = toolBarLayout;

  return (
    <div>
      <Header
        tools={primaryToolBarLayout.tools}
        moreTools={primaryToolBarLayout.moreTools}
      />
      <div
        className="flex flex-row flex-no-wrap flex-1 items-stretch overflow-hidden w-full"
        style={{ height: 'calc(100vh - 57px' }}
      >
        <SidePanel
          side="left"
          defaultComponentOpen={leftPanelComponents[0].name}
          childComponents={leftPanelComponents}
        />
        <div className="flex flex-col flex-1 h-full pb-2">
          <div className="flex flex-2 w-100 border-b border-transparent h-12">
            <ViewportToolbar tools={secondaryToolBarLayout.tools} />
          </div>
          <div className="flex flex-1 h-full overflow-hidden bg-black items-center justify-center">
            {/*<ViewportGrid
              rows={1}
              cols={2}
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
                  <div className="flex justify-center items-center h-full">
                    CONTENT
                  </div>
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
                  <div className="flex justify-center items-center h-full">
                    CONTENT
                  </div>
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

viewerLayout.defaultProps = {
  toolBarLayout: [
    { tools: [], moreTools: [] },
    { tools: [], moreTools: [] },
  ],
};
