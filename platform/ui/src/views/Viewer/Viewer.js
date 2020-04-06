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
          className="h-100 bg-primary-light border-r-1 border-black"
          iconName="launch-arrow"
          componentName="Study List"
        >
          <div>GUSTAVO</div>
        </SidePanel>
        <div className="flex-1 h-100 overflow-hidden w-100 bg-black">
          CONTENT
        </div>
        <SidePanel
          side="right"
          className="h-100 bg-primary-light border-l-1 border-black"
          iconName="launch-arrow"
          componentName="Measurements"
        >
          <div>GUSTAVO DO OUTRO LADO</div>
        </SidePanel>
      </div>
    </div>
  );
};

export default Viewer;
