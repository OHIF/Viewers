import React from 'react';
import { WrappedPanelStudyBrowser } from './Panels';

import MeasurementTable from './MeasurementTable.js';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedMeasurementPanel = () => {
    return (
      <MeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
    );
  };

  return [
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: WrappedPanelStudyBrowser.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: wrappedMeasurementPanel,
    },
  ];
}

export default getPanelModule;

// // TODO -> Need some way of selecting which displaySets hit the viewports.
// const { DisplaySetService } = servicesManager.services;

// // TODO -> Make a HangingProtocolService
// const HangingProtocolService = displaySets => {
//   const displaySetInstanceUid = displaySets[Object.keys(displaySets)[0]][0].displaySetInstanceUid;

//   return {
//     numRows: 1,
//     numCols: 1,
//     activeViewportIndex: 0,
//     viewports: [
//       {
//         displaySetInstanceUid,
//       },
//     ],
//   };
// };

// const handleDisplaySetSubscription = useCallback(displaySets => {
//   setViewportGrid(HangingProtocolService(displaySets));
// });

// useEffect(() => {
//   const { unsubscribe } = DisplaySetService.subscribe(
//     DisplaySetService.EVENTS.DISPLAY_SET_ADDED,
//     handleDisplaySetSubscription
//   );

//   return unsubscribe;
// }, []);
