import measurementLabelsImage from '../../../assets/img/measurement-labels-auto.png';
import seriesSortImage from '../../../assets/img/seriesSort.png';
import windowLevelPresetsImage from '../../../assets/img/windowLevelPresets.png';
import colorbarImage from '../../../assets/img/colorbarImage.png';

export const customizations = [
  {
    id: 'measurementLabels',
    description: 'Labels for measurement tools in the viewer that are automatically asked for.',
    image: measurementLabelsImage,
    default: [],
    configuration: `
window.config = {
  customizationService: [
    {
      measurementLabels: {
        $set: {
          labelOnMeasure: true,
          exclusive: true,
          items: [
            { value: 'Head', label: 'Head' },
            { value: 'Shoulder', label: 'Shoulder' },
            { value: 'Knee', label: 'Knee' },
            { value: 'Toe', label: 'Toe' },
          ],
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'studyBrowser.sortFunctions',
    description: 'Sorting options for study browser items.',
    image: seriesSortImage,
    default: [
      {
        label: 'Series Number',
        sortFunction: (a, b) => {
          return a?.SeriesNumber - b?.SeriesNumber;
        },
      },
      {
        label: 'Series Date',
        sortFunction: (a, b) => {
          const dateA = new Date(formatDate(a?.SeriesDate));
          const dateB = new Date(formatDate(b?.SeriesDate));
          return dateB.getTime() - dateA.getTime();
        },
      },
    ],
    configuration: `
window.config = {
  customizationService: [
    {
      'studyBrowser.sortFunctions': {
        $push: [
          {
            label: 'Series Stuff',
            sortFunction: (a, b) => Stuff,
          },
        ],
      },
    },
  ],
};
    `,
  },
  {
    id: 'cornerstoneViewportClickCommands',
    description: 'Defines the viewport event handlers such as button1, button2, doubleClick, etc.',
    default: {
      doubleClick: {
        commandName: 'toggleOneUp',
        commandOptions: {},
      },
      button1: {
        commands: [
          {
            commandName: 'closeContextMenu',
          },
        ],
      },
      button3: {
        commands: [
          {
            commandName: 'showCornerstoneContextMenu',
            commandOptions: {
              requireNearbyToolData: true,
              menuId: 'measurementsContextMenu',
            },
          },
        ],
      },
    },
    configuration: `
window.config = {
  customizationService: [
    {
      cornerstoneViewportClickCommands: {
        doubleClick: {
          $push: [
            () => {
              console.debug('double click');
            },
          ],
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cinePlayer',
    description: 'Customizes the cine player component.',
    default: 'The CinePlayer component in the UI',
    configuration: null,
  },
  {
    id: 'cornerstone.windowLevelPresets',
    description: 'Window level presets for the cornerstone viewport.',
    image: windowLevelPresetsImage,
    default: {
      CT: [
        { description: 'Soft tissue', window: '400', level: '40' },
        { description: 'Lung', window: '1500', level: '-600' },
        { description: 'Liver', window: '150', level: '90' },
        { description: 'Bone', window: '2500', level: '480' },
        { description: 'Brain', window: '80', level: '40' },
      ],

      PT: [
        { description: 'Default', window: '5', level: '2.5' },
        { description: 'SUV', window: '0', level: '3' },
        { description: 'SUV', window: '0', level: '5' },
        { description: 'SUV', window: '0', level: '7' },
        { description: 'SUV', window: '0', level: '8' },
        { description: 'SUV', window: '0', level: '10' },
        { description: 'SUV', window: '0', level: '15' },
      ],
    },
    configuration: `
window.config = {
  customizationService: [
    {
      'cornerstone.windowLevelPresets': {
        $filter: {
          match: { id: 'ct-soft-tissue' },
          $merge: {
            window: '500',
            level: '50',
          },
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cornerstone.colorbar',
    description: 'Customizes the appearance and behavior of the cornerstone colorbar.',
    image: colorbarImage,
    default: `
     {
      width: '16px',
      colorbarTickPosition: 'left',
      colormaps,
      colorbarContainerPosition: 'right',
      colorbarInitialColormap: DefaultColormap,
    }
    `,
    configuration: `
window.config = {
  customizationService: [
    {
      'cornerstone.colorbar': {
        $merge: {
          width: '20px',
          colorbarContainerPosition: 'left',
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cornerstone.3dVolumeRendering',
    description:
      'Customizes the settings for 3D volume rendering in the cornerstone viewport, including presets and rendering quality range.',
    default: `{
      volumeRenderingPresets: VIEWPORT_PRESETS,
      volumeRenderingQualityRange: {
        min: 1,
        max: 4,
        step: 1,
      },
    }`,
    configuration: `
window.config = {
  customizationService: [
    {
      'cornerstone.3dVolumeRendering': {
        $merge: {
          volumeRenderingQualityRange: {
            min: 2,
            max: 6,
            step: 0.5,
          },
        },
      },
    },
  ],
};
    `,
  },
];

const segmentationCustomizations = [];
