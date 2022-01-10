const windowLevelPresets = {
  1: { description: 'Soft tissue', window: '400', level: '40' },
  2: { description: 'Lung', window: '1500', level: '-600' },
  3: { description: 'Liver', window: '150', level: '90' },
  4: { description: 'Bone', window: '80', level: '40' },
  5: { description: 'Brain', window: '2500', level: '480' },
  6: { description: 'Trest', window: '1', level: '1' },
  7: { description: 'Empty1', window: 'Empty1', level: 'Empty1' },
  8: { description: 'Empty2', window: 'Empty2', level: 'Empty2' },
  9: { description: 'Empty3', window: 'Empty3', level: 'Empty3' },
  10: { description: 'Empty4', window: 'Empty4', level: 'Empty4' },
};

const config = {
  routerBasename: '/',
  // whiteLabelling: {},
  extensions: [],
  modes: [],
  showStudyList: true,
  // filterQueryParam: false,
  dataSources: [
    {
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: 'org.ohif.default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
    {
      friendlyName: 'dicom json',
      namespace: 'org.ohif.default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        name: 'json',
      },
    },
    {
      friendlyName: 'dicom local',
      namespace: 'org.ohif.default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {},
    },
  ],
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
  // whiteLabeling: {
  //   /* Optional: Should return a React component to be rendered in the "Logo" section of the application's Top Navigation bar */
  //   createLogoComponentFn: function (React) {
  //     return React.createElement(
  //       'a',
  //       {
  //         target: '_self',
  //         rel: 'noopener noreferrer',
  //         className: 'text-purple-600 line-through',
  //         href: '/',
  //       },
  //       React.createElement('img',
  //         {
  //           src: './customLogo.svg',
  //           className: 'w-8 h-8',
  //         }
  //       ))
  //   },
  // },
  defaultDataSourceName: 'dicomweb',
  hotkeys: [
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
      label: 'Length',
      keys: ['l'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Bidirectional' },
      label: 'Bidirectional',
      keys: ['b'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'ArrowAnnotate' },
      label: 'Annotation',
      keys: ['a'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'EllipticalRoi' },
      label: 'Ellipse',
      keys: ['e'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'NLFreehandRoi' },
      label: 'Freehand',
      keys: ['f'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      label: 'Zoom',
      keys: ['z'],
      isEditable: true,
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      label: 'Pan',
      keys: ['p'],
      isEditable: true,
    },
    {
      commandName: 'toggleReferenceLines',
      label: 'Reference Lines',
      keys: ['r'],
      isEditable: true,
    },
    {
      commandName: 'activateCrosshairs',
      label: 'Crosshairs',
      keys: ['c'],
      isEditable: true,
    },
    {
      commandName: 'toggleSeriesLinking',
      label: 'Series Linking',
      keys: ['s'],
      isEditable: true,
    },
    {
      commandName: 'scaleUpViewport',
      label: 'Zoom In',
      keys: ['+'],
      isEditable: true,
    },
    {
      commandName: 'scaleDownViewport',
      label: 'Zoom Out',
      keys: ['-'],
      isEditable: true,
    },
    {
      commandName: 'fitViewportToWindow',
      label: 'Zoom to Fit',
      keys: ['='],
      isEditable: true,
    },
    {
      commandName: 'rotateViewportCW',
      label: 'Rotate Right',
      keys: ['alt', 'r'],
      isEditable: true,
    },
    {
      commandName: 'rotateViewportCCW',
      label: 'Rotate Left',
      keys: ['alt', 'l'],
      isEditable: true,
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Horizontally',
      keys: ['h'],
      isEditable: true,
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Vertically',
      keys: ['v'],
      isEditable: true,
    },
    {
      commandName: 'toggleCine',
      label: 'Cine',
      keys: ['x'],
      isEditable: true,
    },
    {
      commandName: 'invertViewport',
      label: 'Invert',
      keys: ['i'],
      isEditable: true,
    },
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Image Viewport',
      keys: ['right'],
      isEditable: true,
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Image Viewport',
      keys: ['left'],
      isEditable: true,
    },
    {
      commandName: 'nextViewportDisplaySet',
      label: 'Next Series',
      keys: ['pageup'],
      isEditable: true,
    },
    {
      commandName: 'previousViewportDisplaySet',
      label: 'Previous Series',
      keys: ['pagedown'],
      isEditable: true,
    },
    {
      commandName: 'nextImage',
      label: 'Next Image',
      keys: ['down'],
      isEditable: true,
    },
    {
      commandName: 'previousImage',
      label: 'Previous Image',
      keys: ['up'],
      isEditable: true,
    },
    {
      commandName: 'firstImage',
      label: 'First Image',
      keys: ['home'],
      isEditable: true,
    },
    {
      commandName: 'lastImage',
      label: 'Last Image',
      keys: ['end'],
      isEditable: true,
    },
    {
      commandName: 'resetViewport',
      label: 'Reset',
      keys: ['space'],
      isEditable: true,
    },
    {
      commandName: 'cancelMeasurement',
      label: 'Cancel Cornerstone Measurement',
      keys: ['esc'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[1],
      label: 'W/L Preset 1',
      keys: ['1'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[2],
      label: 'W/L Preset 2',
      keys: ['2'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[3],
      label: 'W/L Preset 3',
      keys: ['3'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[4],
      label: 'W/L Preset 4',
      keys: ['4'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[5],
      label: 'W/L Preset 5',
      keys: ['5'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[6],
      label: 'W/L Preset 6',
      keys: ['6'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[7],
      label: 'W/L Preset 7',
      keys: ['7'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[8],
      label: 'W/L Preset 8',
      keys: ['8'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[9],
      label: 'W/L Preset 9',
      keys: ['9'],
      isEditable: true,
    },
  ],
};

export default config;
