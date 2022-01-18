const windowLevelPresets = {
  1: { description: 'Soft tissue', window: '400', level: '40' },
  2: { description: 'Lung', window: '1500', level: '-600' },
  3: { description: 'Liver', window: '150', level: '90' },
  4: { description: 'Bone', window: '80', level: '40' },
  5: { description: 'Brain', window: '2500', level: '480' },
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
      commandOptions: { toolName: 'Wwwc' },
      label: 'Wwwc',
      keys: ['w'],
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
      commandOptions: { toolName: 'rotate-right' },
      label: 'Rotate Right',
      keys: ['alt', 'r'],
      isEditable: true,
    },
    {
      commandName: 'rotateViewportCCW',
      commandOptions: { toolName: 'rotate-right' },
      label: 'Rotate Left',
      keys: ['alt', 'l'],
      isEditable: true,
    },
    {
      commandName: 'flipViewportHorizontal',
      commandOptions: { toolName: 'flip-horizontal' },
      label: 'Flip Horizontally',
      keys: ['h'],
      isEditable: true,
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Vertically',
      keys: ['v'],
      isEditable: true,
    },
    {
      commandName: 'toggleCine',
      commandOptions: { toolName: 'cine' },
      label: 'Cine',
      keys: ['x'],
      isEditable: true,
    },
    {
      commandName: 'invertViewport',
      commandOptions: { toolName: 'invert' },
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
      commandOptions: { toolName: 'Reset' },
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
      label: 'W/L - Soft tissue',
      keys: ['1'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[2],
      label: 'W/L - Lung',
      keys: ['2'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[3],
      label: 'W/L - Liver',
      keys: ['3'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[4],
      label: 'W/L - Bone',
      keys: ['4'],
      isEditable: true,
    },
    {
      commandName: 'setWindowLevel',
      commandOptions: windowLevelPresets[5],
      label: 'W/L - Brain',
      keys: ['5'],
      isEditable: true,
    },
  ],
};

export default config;
