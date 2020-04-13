import React from 'react';
import { SidePanel, StudyBrowser } from '@ohif/ui';

import Header from './components/Header';
import ViewportToolbar from './components/ViewportToolBar';

const Viewer = () => {
  return (
    <div>
      <Header />
      <div
        className="flex flex-row flex-no-wrap flex-1 items-stretch overflow-hidden w-full"
        style={{ height: 'calc(100vh - 57px' }}
      >
        <SidePanel
          side="left"
          iconName="group-layers"
          iconLabel="Studies"
          componentLabel="Studies"
          defaultIsOpen={true}
        >
          <StudyBrowser />
        </SidePanel>
        <div className="flex flex-1 h-100 overflow-hidden bg-primary-main items-center justify-center text-white">
          <ViewportToolbar />
          <div>CONTENT</div>
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
