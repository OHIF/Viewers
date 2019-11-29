window.config = ({ servicesManager, dependencies }) => {
  const { SimpleDialog, merge } = dependencies;

  const callInputDialog = (data, event, callback) => {
    const { UIDialogService } = servicesManager.services;

    let dialogId = UIDialogService.create({
      centralize: true,
      isDraggable: false,
      content: SimpleDialog.InputDialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Enter your annotation',
        label: 'New label',
        measurementData: data ? { description: data.text } : {},
        onClose: () => UIDialogService.dismiss({ id: dialogId }),
        onSubmit: value => {
          callback(value);
          UIDialogService.dismiss({ id: dialogId });
        },
      },
    });
  };

  const allToolsProps = Object.assign(
    ...[
      'Bidirectional',
      'Length',
      'Angle',
      'FreehandRoi',
      'EllipticalRoi',
      'CircleRoi',
      'RectangleRoi',
      'ArrowAnnotate',
    ].map(tool => ({
      [tool]: {
        configuration: {
          getMeasurementLocationCallback: (eventData, tool, options) => {
            console.log(eventData, tool, options);
          },
        },
      },
    }))
  );

  const specificToolsProps = {
    ArrowAnnotate: {
      configuration: {
        getTextCallback: (callback, eventDetails) =>
          callInputDialog(null, eventDetails, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(data, eventDetails, callback),
      },
    },
  };

  /* Merge generic with specific tools props. */
  for (const toolName in specificToolsProps) {
    allToolsProps[toolName] = merge(
      allToolsProps[toolName],
      specificToolsProps[toolName]
    );
  }

  const tools = allToolsProps;

  return {
    // default: '/'
    routerBasename: '/',
    extensions: [],
    showStudyList: true,
    filterQueryParam: false,
    servers: {
      dicomWeb: [
        {
          name: 'DCM4CHEE',
          wadoUriRoot:
            'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
          qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
          wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
          qidoSupportsIncludeField: true,
          imageRendering: 'wadors',
          thumbnailRendering: 'wadors',
          enableStudyLazyLoad: true,
        },
      ],
    },
    // Extensions should be able to suggest default values for these?
    // Or we can require that these be explicitly set
    hotkeys: [
      // ~ Global
      {
        commandName: 'incrementActiveViewport',
        label: 'Next Image Viewport',
        keys: ['right'],
      },
      {
        commandName: 'decrementActiveViewport',
        label: 'Previous Image Viewport',
        keys: ['left'],
      },
      // Supported Keys: https://craig.is/killing/mice
      // ~ Cornerstone Extension
      { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
      { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
      { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
      {
        commandName: 'flipViewportVertical',
        label: 'Flip Horizontally',
        keys: ['h'],
      },
      {
        commandName: 'flipViewportHorizontal',
        label: 'Flip Vertically',
        keys: ['v'],
      },
      { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
      { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
      { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
      { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
      // clearAnnotations
      { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
      { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
      // firstImage
      // lastImage
      {
        commandName: 'nextViewportDisplaySet',
        label: 'Previous Series',
        keys: ['pagedown'],
      },
      {
        commandName: 'previousViewportDisplaySet',
        label: 'Next Series',
        keys: ['pageup'],
      },
      // ~ Cornerstone Tools
      { commandName: 'setZoomTool', label: 'Zoom', keys: ['z'] },
    ],
    tools,
  };
};
