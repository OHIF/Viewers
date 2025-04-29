import React from 'react';
import { NavBar, IconButton } from '../../../components';
import { Icons } from '@ohif/ui-next';

const Header = () => {
  return (
    <NavBar className="justify-between border-b-4 border-black">
      <div className="flex flex-1 justify-between">
        <div className="flex items-center">
          <div className="mr-3 inline-flex items-center">
            <Icons.ArrowLeft
              className="text-primary-active w-8 cursor-pointer"
              onClick={() => alert('Navigate to previous page')}
            />
            <a
              href="#"
              className="ml-4"
            >
              <Icons.OHIFLogo />
            </a>
          </div>
        </div>
        <div className="flex items-center"></div>
        <div className="flex items-center">
          <span className="text-common-light mr-3 text-lg">FOR INVESTIGATIONAL USE ONLY</span>
          <IconButton
            variant="text"
            color="inherit"
            className="text-primary-active"
            onClick={() => {}}
          >
            <React.Fragment>
              <Icons.Settings /> <Icons.ChevronOpen />
            </React.Fragment>
          </IconButton>
        </div>
      </div>
    </NavBar>
  );
};

export default Header;
