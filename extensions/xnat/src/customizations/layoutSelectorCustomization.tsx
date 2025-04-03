/**
 * Layout selector customization for XNAT extension
 * Adds MPR and 3D hanging protocol presets to the Layout selector dropdown menu
 */

export default {
  'layoutSelector.commonPresets': [
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
  'layoutSelector.advancedPresetGenerator': ({ servicesManager }) => {
    // Add the MPR and 3D specific presets at the top of the list
    // These will be our primary advanced preset options
    return [
      {
        icon: 'layout-advanced-mpr',
        title: 'MPR',
        commandOptions: {
          protocolId: 'mpr',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-3d-main',
        title: '3D',
        commandOptions: {
          protocolId: 'main3D',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-3d-primary',
        title: '3D Primary',
        commandOptions: {
          protocolId: 'primary3D',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-axial-primary',
        title: 'Axial Primary',
        commandOptions: {
          protocolId: 'primaryAxial',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-3d-four-up',
        title: 'Four Up',
        commandOptions: {
          protocolId: 'fourUp',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-mpr',
        title: 'Frame View',
        commandOptions: {
          protocolId: 'frameView',
        },
        disabled: false,
      },
      {
        icon: 'layout-advanced-3d-only',
        title: 'Only 3D',
        commandOptions: {
          protocolId: 'only3D',
        },
        disabled: false,
      },
    ];
  },
}; 