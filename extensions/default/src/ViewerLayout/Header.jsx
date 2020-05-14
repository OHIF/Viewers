import React, { useState } from 'react';
import PropTypes from 'prop-types';
//
import { NavBar, Svg, Icon, IconButton, Toolbar } from '@ohif/ui';

function Header({ tools, moreTools }) {
  const [activeTool, setActiveTool] = useState('Zoom');
  // const dropdownContent = [
  //   {
  //     name: 'Soft tissue',
  //     value: '400/40',
  //   },
  //   { name: 'Lung', value: '1500 / -600' },
  //   { name: 'Liver', value: '150 / 90' },
  //   { name: 'Bone', value: '2500 / 480' },
  //   { name: 'Brain', value: '80 / 40' },
  // ];

  // TODO -> In ToolBarManager => Consume commandName and commandOptions and create onClick?

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
}

Header.propTypes = {
  tools: PropTypes.array.isRequired,
  moreTools: PropTypes.array.isRequired,
};

export default Header;
