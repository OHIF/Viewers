import { Types } from '@ohif/core';

const MPRHangingProtocolGenerator: Types.HangingProtocol.ProtocolGenerator = ({
  servicesManager,
  commandsManager,
}) => {
  const {
    ViewportGridService,
    UINotificationService,
    DisplaySetService,
  } = servicesManager.services;

  const { activeViewportIndex, viewports } = ViewportGridService.getState();
  const viewportDisplaySetInstanceUIDs =
    viewports[activeViewportIndex].displaySetInstanceUIDs;

  if (
    !viewportDisplaySetInstanceUIDs ||
    !viewportDisplaySetInstanceUIDs.length
  ) {
    return;
  }

  const displaySetsToHang = viewportDisplaySetInstanceUIDs.map(
    displaySetInstanceUID => {
      const displaySet = DisplaySetService.getDisplaySetByUID(
        displaySetInstanceUID
      );

      return displaySet;
    }
  );

  if (displaySetsToHang.some(ds => !ds.isReconstructable)) {
    UINotificationService.show({
      title: 'Multiplanar reconstruction (MPR) ',
      message:
        'Cannot create MPR for this series since it is not reconstructable.',
      type: 'warning',
      displayTime: 3000,
    });

    return;
  }

  const matchingDisplaySets = {};

  displaySetsToHang.forEach(displaySet => {
    const {
      displaySetInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = displaySet;

    matchingDisplaySets[displaySetInstanceUID] = {
      displaySetInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } as Types.HangingProtocol.DisplaySetMatchDetails;
  });

  const hpViewports: Types.HangingProtocol.Viewport[] = [
    'axial',
    'sagittal',
    'coronal',
  ].map(viewportOrientation => {
    return {
      viewportOptions: {
        toolGroupId: 'mpr',
        viewportType: 'volume',
        orientation: viewportOrientation,
        initialImageOptions: {
          preset: 'middle',
        },
        syncGroups: [
          {
            type: 'voi',
            id: 'mpr',
            source: true,
            target: true,
          },
        ],
      },
      displaySets: viewportDisplaySetInstanceUIDs.map(displaySetInstanceUID => {
        return {
          id: displaySetInstanceUID,
        };
      }),
    };
  });

  const protocol = {
    id: 'mpr',
    stages: [
      {
        id: 'mprStage',
        name: 'mpr',
        viewportStructure: {
          layoutType: 'grid',
          properties: {
            rows: 1,
            columns: 3,
            layoutOptions: [
              {
                x: 0,
                y: 0,
                width: 1 / 3,
                height: 1,
              },
              {
                x: 1 / 3,
                y: 0,
                width: 1 / 3,
                height: 1,
              },
              {
                x: 2 / 3,
                y: 0,
                width: 1 / 3,
                height: 1,
              },
            ],
          },
        },
        displaySets: [],
        viewports: hpViewports,
      },
    ],
  };

  return {
    protocol,
    matchingDisplaySets,
  };
};

function getHangingProtocolModule() {
  return [
    {
      id: 'mpr',
      protocol: MPRHangingProtocolGenerator,
    },
  ];
}

export default getHangingProtocolModule;
