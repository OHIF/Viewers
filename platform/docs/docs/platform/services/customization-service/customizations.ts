import measurementLabelsImage from '../../../assets/img/measurement-labels-auto.png';
import seriesSortImage from '../../../assets/img/seriesSort.png';

export const customizations = [
  {
    id: 'measurementLabels',
    description: 'Labels for measurement tools in the viewer that are automatically asked for.',
    image: measurementLabelsImage,
    default: [],
    configuration: `
customizationService.setCustomizations({
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
});
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
customizationService.setCustomizations({
  'studyBrowser.sortFunctions': {
    $push: [
      {
        label: 'Series Stuff',
        sortFunction: (a, b) => Stuff,
      },
    ],
  },
});
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
customizationService.setCustomizations({
  cornerstoneViewportClickCommands: {
        doubleClick: {
          commands: {
          $push: [
            {
              commandName: 'rotateViewport',
              commandOptions: {
                rotation: 45,
              },
            },
          ],
        },
      },
    },
  },
];
