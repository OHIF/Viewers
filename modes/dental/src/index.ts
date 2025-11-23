import { id } from './id';

export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
};

/**
 * Indicate this is a valid mode for dental imaging studies
 */
export function isValidMode({ modalities }) {
  // Accept any study for dental mode
  return true;
}

const modeInstance = {
  id,
  displayName: 'Dental Mode',
  onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
    const { toolbarService, toolGroupService, customizationService } = servicesManager.services;

    // Initialize basic dental viewing layout
    return {
      studies: [],
    };
  },
  onModeExit: () => {
    // Cleanup when exiting mode
  },
  validationTags: {
    study: [],
    series: [],
  },
  isValidMode,
  routes: [
    {
      path: 'dental',
      layoutTemplate: () => {
        return {
          id: 'ohif.layoutTemplate.viewerLayout',
          props: {
            leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
            rightPanels: ['@ohif/extension-default.panelModule.measure'],
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
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  sopClassHandlers: ['@ohif/extension-default.sopClassHandlerModule.stack'],
};

const mode = {
  id,
  modeFactory: ({ modeConfiguration }) => {
    return modeInstance;
  },
  extensionDependencies,
};

export default mode;
