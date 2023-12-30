import React from 'react';

import { DataSourceWrapper, WorkList } from '@ohif/app';

function MultiMonitor(props) {
  console.log('multiMonitor', props);

  const screenDetailsPromise = window.getScreenDetails?.();
  if (screenDetailsPromise) {
    screenDetailsPromise.then(screenDetails => {
      const { screens } = screenDetails;
      console.log('Hello multi-monitor', ...screens);
      const width = Math.floor(screens[0].availWidth / 2) - 2;
      const height = screens[0].availHeight;
      const window1 = window.open(
        'http://localhost:3000/basic-test?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&hangingProtocolId=@ohif/mnGrid&screen=0-0.5',
        'ohifScreen1',
        `screenX=0,top=0,width=${width},height=${height}`
      );
      const window2 = window.open(
        'http://localhost:3000/basic-test?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&hangingProtocolId=@ohif/mnGrid&screen=0.5-1',
        'ohifScreen2',
        `screenX=${width + 1},top=0,width=${width},height=${height}`
      );
      console.log('Opened', window1, window2);
      window.window1 = window1;
      window.window2 = window2;
    });
  } else {
    console.log('Not multi monitor', screenDetails);
  }

  return (
    <DataSourceWrapper
      {...props}
      children={WorkList}
    />
  );
}

export default MultiMonitor;
