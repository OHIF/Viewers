import React from 'react';
import { SidePanel, StudyBrowser } from '../../components';
import { DragAndDropProvider } from '../../contextProviders';

import Header from './components/Header';

const Viewer = () => {
  return (
    <DragAndDropProvider>
      <div>
        <Header />
        <div
          className="flex flex-row flex-nowrap items-stretch flex-1 w-full overflow-hidden"
          style={{ height: 'calc(100vh - 52px' }}
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
          <div className="flex items-center justify-center flex-1 overflow-hidden text-white h-100 bg-primary-main">
            {/* <ViewportToolbar /> */}
            <div>CONTENT</div>
          </div>
          <SidePanel
            side="right"
            iconName="list-bullets"
            iconLabel="Measure"
            componentLabel="Measurements"
            defaultIsOpen={false}
          >
            <div className="flex justify-center p-2 text-white">
              panel placeholder
            </div>
          </SidePanel>
        </div>
      </div>
    </DragAndDropProvider>
  );
};

export default Viewer;
