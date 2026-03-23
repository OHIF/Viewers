/**
 * ECG Mode
 *
 * An OHIF mode that activates the ECG Tools, Smart Paint, and Flatfoot
 * extensions in a dedicated layout. The mode's right panel shows the
 * ECG measurement panel; the left panel shows the study browser.
 *
 * Route: /viewer/ecg
 */

import { id } from './id';

const ecgMode = {
  id,
  routeName: 'viewer/ecg',
  displayName: 'ECG & Clinical Tools',

  onModeEnter({ servicesManager, extensionManager, commandsManager }) {
    const { toolbarService } = servicesManager.services;

    // Register toolbar buttons for ECG tools extension
    toolbarService?.init?.();
  },

  onModeExit({ servicesManager }) {
    const { toolbarService } = servicesManager.services;
    toolbarService?.reset?.();
  },

  isValidMode({ modalities }) {
    // ECG mode is valid for ECG modality and all non-DICOM image uploads
    if (!modalities) return { valid: true };
    const mods = modalities.split('\\');
    return { valid: true, description: 'ECG & Clinical Tools' };
  },

  routes: [
    {
      path: 'dicomlocal',
      layoutTemplate: () => {
        return {
          id: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
          props: {
            leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
            rightPanels: [
              '@custom/extension-ecg-tools.panelModule.ecgViewer',
              '@custom/extension-smart-paint.panelModule.smartPaint',
              '@custom/extension-flatfoot.panelModule.flatfootMeasurement',
            ],
            viewports: [
              {
                namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
                displaySetsToDisplay: ['@ohif/extension-default.sopClassHandlerModule.stack'],
              },
            ],
          },
        };
      },
    },
  ],

  extensions: {
    '@ohif/extension-default': '^3.0.0',
    '@ohif/extension-cornerstone': '^3.0.0',
    '@custom/extension-ecg-tools': '^1.0.0',
    '@custom/extension-smart-paint': '^1.0.0',
    '@custom/extension-flatfoot': '^1.0.0',
  },

  sopClassHandlers: ['@ohif/extension-default.sopClassHandlerModule.stack'],
};

export default ecgMode;
