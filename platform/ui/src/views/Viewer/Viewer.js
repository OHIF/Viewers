import React from 'react';
import { NavBar, SidePanel, Svg } from '@ohif/ui';

const Viewer = () => {
  return (
    <div>
      <NavBar className="justify-start">
        <div className="m-3">
          <Svg name="logo-ohif" />
        </div>
      </NavBar>
      <div
        className="flex flex-row flex-no-wrap flex-1 items-stretch overflow-hidden w-full"
        style={{ height: 'calc(100vh - 57px' }}
      >
        <SidePanel
          side="left"
          iconName="icon-nav-studies"
          iconLabel="Studies"
          componentLabel="Studies"
          defaultIsOpen={false}
        >
          <div className="flex justify-center text-white p-2">
            panel placeholder
          </div>
        </SidePanel>
        <div className="flex flex-1 h-100 overflow-hidden w-100 bg-primary-main items-center justify-center text-white">
          CONTENT
        </div>
        <SidePanel
          side="right"
          iconName="list-bullets"
          iconLabel="Measure"
          componentLabel="Measurements"
          defaultIsOpen={false}
        >
          <div className="flex justify-center text-white p-2">
            panel placeholder
          </div>
        </SidePanel>
      </div>
    </div>
  );
};

export default Viewer;
