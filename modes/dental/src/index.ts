import { id } from './id';

export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
};

/**
 * Indicate this is a valid mode for dental imaging studies
 */
export function isValidMode({ modalities, series, study }) {
  console.log('Dental Mode isValidMode called with:', { modalities, series, study });

  // Handle modalities as string (OHIF format: "CT\\MR\\PX")
  if (modalities) {
    const modalityList = modalities.split('\\');
    console.log('Processed modalities:', modalityList);

    // Check for dental-specific modalities
    const dentalModalities = ['DX', 'PX', 'IO', 'PAN', 'CEPH'];
    const foundDentalModality = dentalModalities.find(
      mod => modalityList.includes(mod) || modalityList.includes(mod.toLowerCase())
    );

    if (foundDentalModality) {
      console.log('Dental modality found! Activating dental mode');
      return {
        valid: true,
        description: `Dental mode activated for ${foundDentalModality} modality`,
      };
    }
  }

  // Check for dental keywords in series descriptions
  if (series && Array.isArray(series)) {
    const dentalKeywords = [
      'dental',
      'intraoral',
      'panoramic',
      'cephalometric',
      'bitewing',
      'periapical',
    ];
    const foundKeyword = dentalKeywords.find(keyword => {
      return series.some(s => {
        const desc = s.SeriesDescription?.toLowerCase();
        return desc && desc.includes(keyword);
      });
    });

    if (foundKeyword) {
      console.log('Dental series description found! Activating dental mode');
      return {
        valid: true,
        description: `Dental mode activated for ${foundKeyword} series`,
      };
    }
  }

  console.log('No dental indicators found');
  return {
    valid: false,
    description:
      'Dental mode requires PX, DX, IO, PAN, or CEPH modalities, or dental-related series descriptions',
  };
}

const modeInstance = {
  id,
  displayName: 'Dental Mode',
  routeName: 'dental',
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
      layoutTemplate: ({ location, servicesManager }) => {
        return {
          id: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
          props: {
            leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
            rightPanels: ['@ohif/extension-cornerstone.panelModule.panelMeasurement'],
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
