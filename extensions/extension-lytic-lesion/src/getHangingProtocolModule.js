import hpMNGrid from './hpMNGrid';

// const colormapAnd3d = {
//   id: 'colormapAnd3d',
//   locked: true,
//   // Don't store this hanging protocol as it applies to the currently active
//   // display set by default
//   // cacheId: null,
//   hasUpdatedPriorsInformation: false,
//   name: 'colormapAnd3d',
//   createdDate: '2021-02-23T19:22:08.894Z',
//   modifiedDate: '2023-04-01',
//   availableTo: {},
//   editableBy: {},
//   protocolMatchingRules: [],
//   imageLoadStrategy: 'nth',

//   toolGroupIds: ['default'],
//   // -1 would be used to indicate active only, whereas other values are
//   // the number of required priors referenced - so 0 means active with
//   // 0 or more priors.
//   numberOfPriorsReferenced: 0,
//   // Default viewport is used to define the viewport when
//   // additional viewports are added using the layout tool
//   displaySetSelectors: {
//     backgroundDisplaySet: {
//       seriesMatchingRules: [
//         {
//           attribute: 'isReconstructable',
//           constraint: {
//             equals: {
//               value: true,
//             },
//           },
//           required: true,
//         },
//       ],
//     },
//     activeDisplaySet: {
//       seriesMatchingRules: [
//         {
//           attribute: 'isReconstructable',
//           constraint: {
//             equals: {
//               value: true,
//             },
//           },
//           required: true,
//         },
//       ],
//     },
//   },
//   stages: [
//     {
//       name: 'CM3D',
//       viewportStructure: {
//         layoutType: 'grid',
//         properties: {
//           rows: 3,
//           columns: 3,
//           layoutOptions: [
//             {
//               x: 0,
//               y: 0,
//               width: 1 / 3,
//               height: 1 / 3,
//             },
//             {
//               x: 1 / 3,
//               y: 0,
//               width: 1 / 3,
//               height: 1 / 3,
//             },
//             {
//               x: 0,
//               y: 1 / 3,
//               width: 1 / 3,
//               height: 1 / 3,
//             },
//             {
//               x: 1 / 3,
//               y: 1 / 3,
//               width: 1 / 3,
//               height: 1 / 3,
//             },
//             {
//               x: 0,
//               y: 2 / 3,
//               width: 1 / 3,
//               height: 1 / 2,
//             },
//             {
//               x: 1 / 3,
//               y: 2 / 3,
//               width: 1 / 3,
//               height: 1 / 2,
//             },
//             {
//               x: 2 / 3,
//               y: 0 / 3,
//               width: 1 / 3,
//               height: 1,
//             },
//           ],
//         },
//       },
//       viewports: [
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'axial',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'cameraPosition',
//                 id: 'axialSync',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'voi',
//                 id: 'ctWLSync',
//                 source: false,
//                 target: true,
//               },
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'backgroundDisplaySet',
//               options: {
//                 voi: {
//                   windowWidth: '1180',
//                   windowCenter: '233',
//                 },
//               },
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'axial',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'cameraPosition',
//                 id: 'axialSync',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'backgroundDisplaySet',
//               options: {
//                 voi: {
//                   windowWidth: '590',
//                   windowCenter: '233',
//                 },
//               },
//             },
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 colormap: {
//                   name: 'test',
//                   opacity: [
//                     { value: 0, opacity: 0 },
//                     { value: 0.1, opacity: 1 },
//                     { value: 1, opacity: 1 },
//                   ],
//                 },
//                 voi: {
//                   windowWidth: '1180',
//                   windowCenter: '233',
//                 },
//               },
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'coronal',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'cameraPosition',
//                 id: 'coronalSync',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 voi: {
//                   windowWidth: '1180',
//                   windowCenter: '233',
//                 },
//               },
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'coronal',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'cameraPosition',
//                 id: 'coronalSync',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'backgroundDisplaySet',
//               options: {
//                 voi: {
//                   windowWidth: '590',
//                   windowCenter: '233',
//                 },
//               },
//             },
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 colormap: {
//                   name: 'test',
//                   opacity: [
//                     { value: 0, opacity: 0 },
//                     { value: 0.1, opacity: 0.7 },
//                     { value: 1, opacity: 1 },
//                   ],
//                 },
//                 voi: {
//                   windowWidth: '1180',
//                   windowCenter: '233',
//                 },
//               },
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'sagittal',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'cameraPosition',
//                 id: 'sagittalSync',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 voi: {
//                   windowWidth: '1180',
//                   windowCenter: '233',
//                 },
//               },
//             },
//             {
//               id: 'backgroundDisplaySet',
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'mpr',
//             viewportType: 'volume',
//             orientation: 'sagittal',
//             initialImageOptions: {
//               preset: 'middle',
//             },
//             syncGroups: [
//               {
//                 type: 'voi',
//                 id: 'mpr',
//                 source: true,
//                 target: true,
//               },
//               {
//                 type: 'cameraPosition',
//                 id: 'sagittalSync',
//                 source: true,
//                 target: true,
//               },
//             ],
//           },
//           displaySets: [
//             {
//               id: 'backgroundDisplaySet',
//             },
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 colormap: {
//                   name: 'test',
//                   opacity: [
//                     { value: 0, opacity: 0 },
//                     { value: 0.25, opacity: 0.7 },
//                     { value: 0.5, opacity: 1 },
//                     { value: 0.75, opacity: 0.7 },
//                     { value: 1, opacity: 0 },
//                   ],
//                 },
//                 options: {
//                   voi: {
//                     windowWidth: '1180',
//                     windowCenter: '233',
//                   },
//                 },
//               },
//             },
//           ],
//         },
//         {
//           viewportOptions: {
//             toolGroupId: 'volume3d',
//             viewportType: 'volume3d',
//             orientation: 'coronal',
//             customViewportProps: {
//               hideOverlays: true,
//             },
//           },
//           displaySets: [
//             {
//               id: 'activeDisplaySet',
//               options: {
//                 displayPreset: 'CT-Bone',
//               },
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };
const colormapAnd3d = {
  id: 'colormapAnd3d',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  hasUpdatedPriorsInformation: false,
  name: 'colormapAnd3d',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2023-04-01',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  imageLoadStrategy: 'interleaveCenter',

  toolGroupIds: ['default'],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: 0,
  // Default viewport is used to define the viewport when
  // additional viewports are added using the layout tool
  displaySetSelectors: {
    backgroundDisplaySet: {
      seriesMatchingRules: [
        {
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
      ],
    },
    activeDisplaySet: {
      seriesMatchingRules: [
        {
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
      ],
    },
  },
  stages: [
    {
      name: 'CM3D',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
          layoutOptions: [
            {
              x: 0,
              y: 0,
              width: 1 / 2,
              height: 1 / 2,
            },
            {
              x: 1 / 2,
              y: 0,
              width: 1 / 2,
              height: 1 / 2,
            },
            {
              x: 0,
              y: 1 / 2,
              width: 1 / 2,
              height: 1 / 2,
            },
            {
              x: 1 / 2,
              y: 1 / 2,
              width: 1 / 2,
              height: 1 / 2,
            },
          ],
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'axial',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'axialSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ctWLSync',
                source: false,
                target: true,
              },
              {
                type: 'voi',
                id: 'mpr',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'backgroundDisplaySet',
              options: {
                voi: {
                  windowWidth: '1180',
                  windowCenter: '233',
                },
              },
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'coronal',
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
              {
                type: 'cameraPosition',
                id: 'coronalSync',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
              options: {
                voi: {
                  windowWidth: '1180',
                  windowCenter: '233',
                },
              },
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'sagittal',
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
              {
                type: 'cameraPosition',
                id: 'sagittalSync',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
              options: {
                voi: {
                  windowWidth: '1180',
                  windowCenter: '233',
                },
              },
            },
            {
              id: 'backgroundDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'volume3d',
            viewportType: 'volume3d',
            orientation: 'coronal',
            customViewportProps: {
              hideOverlays: true,
            },
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
              options: {
                displayPreset: 'CT-Bone',
              },
            },
          ],
        },
      ],
    },
  ],
};
const mprAnd3DVolumeViewport = {
  id: 'mprAnd3DVolumeViewport',
  locked: true,
  name: 'mpr',
  createdDate: '2023-03-15T10:29:44.894Z',
  modifiedDate: '2023-03-15T10:29:44.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  imageLoadStrategy: 'interleaveCenter',
  displaySetSelectors: {
    mprDisplaySet: {
      seriesMatchingRules: [
        {
          weight: 1,
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
        {
          attribute: 'Modality',
          constraint: {
            equals: {
              value: 'CT',
            },
          },
          required: true,
        },
      ],
    },
  },
  stages: [
    {
      id: 'mpr3Stage',
      name: 'mpr',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'axial',
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
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'volume3d',
            viewportType: 'volume3d',
            orientation: 'coronal',
            customViewportProps: {
              hideOverlays: true,
            },
          },
          displaySets: [
            {
              id: 'mprDisplaySet',
              options: {
                displayPreset: 'CT-Bone',
              },
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'coronal',
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
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'sagittal',
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
          displaySets: [
            {
              id: 'mprDisplaySet',
            },
          ],
        },
      ],
    },
  ],
};
const defaultProtocol = {
  id: 'default',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2023-04-01',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  toolGroupIds: ['default'],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: 0,
  // Default viewport is used to define the viewport when
  // additional viewports are added using the layout tool
  defaultViewport: {
    viewportOptions: {
      viewportType: 'orthographic',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'defaultDisplaySetId',
        matchedDisplaySetsIndex: -1,
      },
    ],
  },
  displaySetSelectors: {
    defaultDisplaySetId: {
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        // Try to match series with images by default, to prevent weird display
        // on SEG/SR containing studies
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
        // This display set will select the specified items by preference
        // It has no affect if nothing is specified in the URL.
        {
          attribute: 'isDisplaySetFromUrl',
          weight: 10,
          constraint: {
            equals: true,
          },
        },
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportType: 'orthographic',
            toolGroupId: 'default',
            // This will specify the initial image options index if it matches in the URL
            // and will otherwise not specify anything.
            initialImageOptions: {
              custom: 'sopInstanceLocation',
            },
            // Other options for initialImageOptions, which can be included in the default
            // custom attribute, or can be provided directly.
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
};
function getHangingProtocolModule() {
  return [
    {
      name: defaultProtocol.id,
      protocol: defaultProtocol,
    },
    {
      name: colormapAnd3d.id,
      protocol: colormapAnd3d,
    },
    // Create a MxN hanging protocol available by default
    {
      name: hpMNGrid.id,
      protocol: hpMNGrid,
    },
    {
      name: mprAnd3DVolumeViewport.id,
      protocol: mprAnd3DVolumeViewport,
    },
  ];
}

export default getHangingProtocolModule;
