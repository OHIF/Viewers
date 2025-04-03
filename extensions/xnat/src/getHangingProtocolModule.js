import { hpMN, hpMN8 } from './hangingprotocols/hpMNGrid';
import hpMNCompare from './hangingprotocols/hpCompare';
import hpMammography from './hangingprotocols/hpMammo';
import hpScale from './hangingprotocols/hpScale';
// Import official MPR and 3D protocols from cornerstone extension
import mpr from './hangingprotocols/mpr';
import main3d from './hangingprotocols/main3D';
import mprAnd3DVolumeViewport from './hangingprotocols/mprAnd3DVolumeViewport';
import fourUp from './hangingprotocols/fourUp';
import primary3D from './hangingprotocols/primary3D';
import primaryAxial from './hangingprotocols/primaryAxial';
import frameView from './hangingprotocols/frameView';

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
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
      syncGroups: [
        {
          type: 'hydrateseg',
          id: 'sameFORId',
          source: true,
          target: true,
          options: {
            matchingRules: ['sameFOR'],
          },
        },
      ],
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
          weight: 10,
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
        // This display set will select the specified items by preference
        // It has no affect if nothing is specified in the URL.
        {
          attribute: 'isDisplaySetFromUrl',
          weight: 20,
          constraint: {
            equals: true,
          },
        },
      ],
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
            viewportType: 'stack',
            viewportId: 'default',
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
            syncGroups: [
              {
                type: 'hydrateseg',
                id: 'sameFORId',
                source: true,
                target: true,
                // options: {
                //   matchingRules: ['sameFOR'],
                // },
              },
            ],
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

// const xnatProtocol = {
//   id: 'xnat-default',
//   name: 'XNAT Default',
//   hasUpdatedPriorsInformation: false,
//   protocolMatchingRules: [],
//   displaySetSelectors: {
//     defaultDisplaySetId: {
//       seriesMatchingRules: [
//         {
//           weight: 10,
//           attribute: 'numImageFrames',
//           constraint: {
//             greaterThan: { value: 0 },
//           },
//         },
//         {
//           attribute: 'isDisplaySetFromUrl',
//           weight: 20,
//           constraint: {
//             equals: true,
//           },
//         },
//       ],
//     },
//   },
//   stages: [{
//     id: 'default',
//     name: 'Default',
//     viewportStructure: {
//       layoutType: 'grid',
//       properties: {
//         rows: 1,
//         columns: 1
//       }
//     },
//     viewports: [{
//       viewportOptions: {
//         toolGroupId: 'default',
//         viewportType: 'stack',
//         syncGroups: [
//           {
//             type: 'hydrateseg',
//             id: 'sameFORId',
//             source: true,
//             target: true,
//             options: {
//               matchingRules: ['sameFOR'],
//             },
//           },
//         ],
//       },
//       displaySets: [
//         {
//           id: 'defaultDisplaySetId',
//         }
//       ]
//     }]
//   }],
//   numberOfPriorsReferenced: 0,
//   toolGroupIds: ['default'],
// };

function getHangingProtocolModule() {
  return [
    {
      name: defaultProtocol.id,
      protocol: defaultProtocol,
    },
    // Create a MxN comparison hanging protocol available by default
    {
      name: hpMNCompare.id,
      protocol: hpMNCompare,
    },
    {
      name: hpMammography.id,
      protocol: hpMammography,
    },
    {
      name: hpScale.id,
      protocol: hpScale,
    },
    // Create a MxN hanging protocol available by default
    {
      name: hpMN.id,
      protocol: hpMN,
    },
    {
      name: hpMN8.id,
      protocol: hpMN8,
    },
    // Add XNAT protocol
    // {
    //   name: xnatProtocol.id,
    //   protocol: xnatProtocol,
    // },
    // Add official cornerstone protocols
    {
      name: mpr.id,
      protocol: mpr,
    },
    {
      name: main3d.id,
      protocol: main3d,
    },
    {
      name: mprAnd3DVolumeViewport.id,
      protocol: mprAnd3DVolumeViewport,
    },
    {
      name: fourUp.id,
      protocol: fourUp,
    },
    {
      name: primary3D.id,
      protocol: primary3D,
    },
    {
      name: primaryAxial.id,
      protocol: primaryAxial,
    },
  ];
}

export default getHangingProtocolModule;
