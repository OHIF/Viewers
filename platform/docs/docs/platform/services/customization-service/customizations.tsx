import React from 'react';
import measurementLabelsImage from '../../../assets/img/measurement-labels-auto.png';
import seriesSortImage from '../../../assets/img/seriesSort.png';
import windowLevelPresetsImage from '../../../assets/img/windowLevelPresets.png';
import colorbarImage from '../../../assets/img/colorbarImage.png';
import segmentationTableModeImage from '../../../assets/img/segmentationTableModeImage.png';
import segmentationTableModeImage2 from '../../../assets/img/segmentationTableModeImage2.png';
import segmentationShowAddSegmentImage from '../../../assets/img/segmentationShowAddSegmentImage.png';
import layoutSelectorCommonPresetsImage from '../../../assets/img/layoutSelectorCommonPresetsImage.png';
import layoutSelectorAdvancedPresetGeneratorImage from '../../../assets/img/layoutSelectorAdvancedPresetGeneratorImage.png';

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
  {
    id: 'autoCineModalities',
    description: 'Specifies the modalities for which the cine player automatically starts.',
    default: ['OT', 'US'],
    configuration: `
window.config = {
  customizationService: [
    {
      'autoCineModalities': {
        $set: ['OT', 'US', 'MR'], // Adds 'MR' as an additional modality for auto cine playback
      },
    },
  ],
};
  `,
  },
  {
    id: 'cornerstone.overlayViewportTools',
    description: 'Configures the tools available in the cornerstone SEG and RT tool groups.',
    default: `{
      active: [
        {
          toolName: toolNames.WindowLevel,
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        },
        {
          toolName: toolNames.Pan,
          bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
        },
        {
          toolName: toolNames.Zoom,
          bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
        },
        {
          toolName: toolNames.StackScroll,
          bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
        },
      ],
      enabled: [
        {
          toolName: toolNames.PlanarFreehandContourSegmentation,
          configuration: {
            displayOnePointAsCrosshairs: true,
          },
        },
      ],
    }`,
    configuration: `
  `,
  },
  {
    id: 'layoutSelector.commonPresets',
    description: 'Defines the default layout presets available in the application.',
    image: layoutSelectorCommonPresetsImage,
    default: [
      {
        icon: 'layout-common-1x1',
        commandOptions: {
          numRows: 1,
          numCols: 1,
        },
      },
      {
        icon: 'layout-common-1x2',
        commandOptions: {
          numRows: 1,
          numCols: 2,
        },
      },
      {
        icon: 'layout-common-2x2',
        commandOptions: {
          numRows: 2,
          numCols: 2,
        },
      },
      {
        icon: 'layout-common-2x3',
        commandOptions: {
          numRows: 2,
          numCols: 3,
        },
      },
    ],
    configuration: `
window.config = {
  customizationService: [
    {
      'layoutSelector.commonPresets': {
        $set: [
          {
            icon: 'layout-common-1x1',
            commandOptions: {
              numRows: 1,
              numCols: 1,
            },
          },
          {
            icon: 'layout-common-1x2',
            commandOptions: {
              numRows: 1,
              numCols: 2,
            },
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'layoutSelector.advancedPresetGenerator',
    description: 'Generates advanced layout presets based on hanging protocols.',
    image: layoutSelectorAdvancedPresetGeneratorImage,
    default: `({ servicesManager }) => {
      // by default any hanging protocol that has isPreset set to true will be included

      // a function that returns an array of presets
      // of form {
      //   icon: 'layout-common-1x1',
      //   title: 'Custom Protocol',
      //   commandOptions: {
      //     protocolId: 'customProtocolId',
      //   },
      //   disabled: false,
      // }
    }`,
    configuration: `
window.config = {
  customizationService: [
    {
      'layoutSelector.advancedPresetGenerator': {
        $apply: (defaultGenerator) => {
          return ({ servicesManager }) => {
            const presets = defaultGenerator({ servicesManager });

            // Add a custom preset for a specific hanging protocol
            presets.push({
              icon: 'custom-icon',
              title: 'Custom Protocol',
              commandOptions: {
                protocolId: 'customProtocolId',
              },
              disabled: false,
            });

            return presets;
          };
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'dicomUploadComponent',
    description: 'Customizes the appearance and behavior of the dicom upload component.',
    default: 'The DicomUpload component in the UI',
    configuration: null,
  },
  {
    id: 'onBeforeSRAddMeasurement',
    description: 'Customizes the behavior of the SR measurement before it is added to the viewer.',
    default: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
      return measurement;
    },
    configuration: `
window.config = {
  customizationService: [
    {
      onBeforeSRAddMeasurement: {
        $set: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
          // Note: it should return measurement
          console.debug('onBeforeSRAddMeasurement');
          return measurement;
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'onBeforeDicomStore',
    description:
      'A hook that modifies the DICOM dictionary before it is stored. The customization should return the modified DICOM dictionary.',
    default: ({ dicomDict, measurementData, naturalizedReport }) => {
      // Default implementation returns the DICOM dictionary as is
      return dicomDict;
    },
    configuration: `
window.config = {
  customizationService: [
    {
      'onBeforeDicomStore': {
        $set: ({ dicomDict, measurementData, naturalizedReport }) => {
          // Example customization: Add a custom tag to the DICOM dictionary
          dicomDict['0010,0010'] = 'CustomizedPatientName'; // Patient's Name (example)
          dicomDict['0008,103E'] = 'CustomStudyDescription'; // Study Description (example)

          // Return the modified DICOM dictionary
          return dicomDict;
        },
      },
    },
  ],
};
  `,
  },
];

export const segmentationCustomizations = [
  {
    id: 'PanelSegmentation.tableMode',
    description: 'Defines the mode of the segmentation table.',
    image: [segmentationTableModeImage, segmentationTableModeImage2],
    default: 'collapsed',
    configuration: `
window.config = {
  customizationService: [
    {
      'PanelSegmentation.tableMode': {
        $set: 'expanded',
      },
    },
  ],
};
    `,
  },
  {
    id: 'PanelSegmentation.showAddSegment',
    description:
      'Controls whether the "Add Segment" button is displayed in the segmentation panel.',
    default: true,
    image: segmentationShowAddSegmentImage,
    configuration: `
window.config = {
  customizationService: [
    {
      'PanelSegmentation.showAddSegment': {
        $set: false, // Set to false to hide the "Add Segment" button
      },
    },
  ],
};
    `,
  },
];

export const measurementsCustomizations = [
  {
    id: 'PanelMeasurement.disableEditing',
    description:
      'Determines whether editing measurements in the viewport is disabled after SR hydration',
    default: false,
    configuration: `
window.config = {
  customizationService: [
    {
      'PanelMeasurement.disableEditing': {
        $set: true, // Disables editing measurements in the panel
      },
    },
  ],
};
  `,
  },
];

export const studyBrowserCustomizations = [
  {
    id: 'PanelStudyBrowser.studyMode',
    description:
      'Controls the study browser mode to determine whether to show all studies (including prior studies) or only the current study.',
    default: `'all'`,
    configuration: `
window.config = {
  customizationService: [
    {
      'PanelStudyBrowser.studyMode': {
         $set: 'primary', // or recent
      },
    },
  ],
};
  `,
  },
  {
    id: 'studyBrowser.viewPresets',
    description: 'Defines the view presets for the study browser, such as list or thumbnail views.',
    default: [
      {
        id: 'list',
        iconName: 'ListView',
        selected: false,
      },
      {
        id: 'thumbnails',
        iconName: 'ThumbnailView',
        selected: true,
      },
    ],
    configuration: `
window.config = {
  customizationService: [
    {
      'studyBrowser.viewPresets': {
        $set: [
          {
            id: 'list',
            iconName: 'ListView',
            selected: true, // Makes the list view the default selected option
          },
          {
            id: 'thumbnails',
            iconName: 'ThumbnailView',
            selected: false,
          },
        ],
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
];

export const TableGenerator = (customizations: any[]) => {
  return customizations.map(({ id, description, default: defaultValue, configuration, image }) => (
    <div
      key={id}
      style={{ marginBottom: '2rem', borderRadius: '8px', padding: '1rem' }}
    >
      <h3
        id={id.toLowerCase().replace(/\./g, '')}
        style={{ marginBottom: '1rem', fontSize: '1.5rem' }}
      >
        {id}
      </h3>
      <table style={{ width: '100%', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>ID</th>
            <td style={{ wordBreak: 'break-word' }}>
              <code>{id}</code>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Description</th>
            <td>
              <div>{description}</div>
              {image && (
                <div>
                  {Array.isArray(image) ? (
                    image.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${id}-${index + 1}`}
                        style={{
                          maxWidth: '50%',
                          height: 'auto',
                          marginTop: '10px',
                          marginRight: '10px',
                        }}
                      />
                    ))
                  ) : (
                    <img
                      src={image}
                      alt={id}
                      style={{ maxWidth: '50%', height: 'auto', marginTop: '10px' }}
                    />
                  )}
                </div>
              )}
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Default Value</th>
            <td style={{ wordBreak: 'break-word' }}>
              <pre>
                {typeof defaultValue === 'string'
                  ? defaultValue
                  : JSON.stringify(defaultValue, null, 2)}
              </pre>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Example</th>
            <td style={{ wordBreak: 'break-word' }}>
              {configuration && (
                <div>
                  <pre>
                    <code>{configuration}</code>
                  </pre>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ));
};
