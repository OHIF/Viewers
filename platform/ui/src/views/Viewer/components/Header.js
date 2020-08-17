import React, { useState } from 'react';
import { NavBar, Svg, Icon, IconButton } from '../../../components';

const Header = () => {
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
              className="flex justify-between px-3 py-2 cursor-pointer hover:bg-secondary-dark"
            >
              <div>
                <span className="text-base text-white">{row.name}</span>
                <span className="ml-3 text-base text-primary-light">
                  {row.value}
                </span>
              </div>
              <span className="ml-4 text-base text-primary-active">{i}</span>
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
  return (
    <NavBar className="justify-between border-b-4 border-black">
      <div className="flex justify-between flex-1">
        <div className="flex items-center">
          <div className="inline-flex items-center mr-3">
            <Icon
              name="chevron-left"
              className="w-8 cursor-pointer text-primary-active"
              onClick={() => alert('Navigate to previous page')}
            />
            <a href="#" className="ml-4">
              <Svg name="logo-ohif" />
            </a>
          </div>
        </div>
        <div className="flex items-center">
          {/* <Toolbar tools={tools} activeTool={activeTool} moreTools={tools} /> */}
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-lg text-common-light">
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

export default Header;
