import React from 'react';
import { NavBar, Svg, Icon, IconButton } from '../../../components';

const Header = () => {
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
