import { classes } from '@ohif/core';
import {
  isValidMode,
  layoutTemplate,
  modeFactory,
  onModeEnter as basicOnModeEnter,
  onModeExit,
} from '@ohif/mode-basic';
import i18n from 'i18next';

import { id } from './id.js';
import initToolGroups, { toolGroupIds } from './initToolGroups.js';
import setCrosshairsConfiguration from './utils/setCrosshairsConfiguration.js';
import setFusionActiveVolume from './utils/setFusionActiveVolume.js';

const { MetadataProvider } = classes;

export const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

export const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
  segPanel: '@ohif/extension-cornerstone.panelModule.panelSegmentationNoHeader',
  measurements: '@ohif/extension-cornerstone.panelModule.measurements',
};

export const tmtv = {
  hangingProtocol: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  petSUV: '@ohif/extension-tmtv.panelModule.petSUV',
  tmtv: '@ohif/extension-tmtv.panelModule.tmtv',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-tmtv': '^3.0.0',
};

/**
 * Extends the basic mode enter (tool groups, toolbar, tool group additions)
 * with the TMTV specifics: the fusion viewport crosshairs/active-volume
 * configuration and the PT VOI hanging protocol attribute.
 */
export function onModeEnter(ctx: withAppTypes) {
  basicOnModeEnter.call(this, ctx);

  const { servicesManager, extensionManager, commandsManager } = ctx;
  const { toolGroupService, customizationService, hangingProtocolService, displaySetService } =
    servicesManager.services;

  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames } = utilityModule.exports;

  const { unsubscribe } = toolGroupService.subscribe(toolGroupService.EVENTS.VIEWPORT_ADDED, () => {
    // For fusion toolGroup we need to add the volumeIds for the crosshairs
    // since in the fusion viewport we don't want both PT and CT to render MIP
    // when slabThickness is modified
    const { displaySetMatchDetails } = hangingProtocolService.getMatchDetails();

    setCrosshairsConfiguration(
      displaySetMatchDetails,
      toolNames,
      toolGroupService,
      displaySetService
    );

    setFusionActiveVolume(displaySetMatchDetails, toolNames, toolGroupService, displaySetService);
  });

  this._unsubscriptions.push(unsubscribe);

  // Function-valued customization; kept out of the registered
  // `tmtvModeCustomizations` block because it needs the mode's
  // commandsManager.  Written at mode scope, so a global-scope customization
  // still overrides it by scope precedence.
  customizationService.setCustomizations({
    'panelSegmentation.onSegmentationAdd': {
      $set: () => {
        commandsManager.run('createNewLabelmapFromPT');
      },
    },
  });

  // For the hanging protocol we need to decide on the window level
  // based on whether the SUV is corrected or not, hence we can't hard
  // code the window level in the hanging protocol but we add a custom
  // attribute to the hanging protocol that will be used to get the
  // window level based on the metadata
  hangingProtocolService.addCustomAttribute(
    'getPTVOIRange',
    'get PT VOI based on corrected or not',
    props => {
      const ptDisplaySet = props.find(imageSet => imageSet.Modality === 'PT');

      if (!ptDisplaySet) {
        return;
      }

      const { imageId } = ptDisplaySet.images[0];
      const imageIdScalingFactor = MetadataProvider.get('scalingModule', imageId);

      const isSUVAvailable = imageIdScalingFactor && imageIdScalingFactor.suvbw;

      if (isSUVAvailable) {
        return {
          windowWidth: 5,
          windowCenter: 2.5,
        };
      }

      return;
    }
  );
}

export const tmtvLayout = {
  id: ohif.layout,
  props: {
    // Literal panel lists; the mode route seeds them into the standard
    // `leftPanels` / `rightPanels` customizations so `mode` phase
    // blocks and global customizations can modify them.
    leftPanels: [ohif.thumbnailList],
    leftPanelResizable: true,
    leftPanelClosed: true,
    rightPanels: [tmtv.tmtv, tmtv.petSUV],
    rightPanelResizable: true,
    viewports: [
      {
        namespace: cs3d.viewport,
        displaySetsToDisplay: [ohif.sopClassHandler],
      },
    ],
  },
};

export const tmtvRoute = {
  path: 'tmtv',
  layoutTemplate,
  layoutInstance: tmtvLayout,
};

export const modeInstance = {
  // TODO: We're using this as a route segment
  // We should not be.
  id,
  routeName: 'tmtv',
  displayName: i18n.t('Modes:Total Metabolic Tumor Volume'),
  // Toolbar/tool-group composition: which capability packs this mode uses.
  // The mode route seeds these onto the Mode customization scope on enter, so
  // `?customization=` modules extend them through the `mode` phase. The tmtv
  // extension supplies the TMTV-specific button/section packs.
  toolbarButtons: [{ $reference: 'tmtv.toolbarButtons' }],
  toolbarSections: [{ $reference: 'tmtv.toolbarSections' }],
  toolGroupAdditions: {
    [toolGroupIds.CT]: [],
    [toolGroupIds.PT]: [],
    [toolGroupIds.Fusion]: [],
    [toolGroupIds.MIP]: [],
    [toolGroupIds.default]: [],
  },
  // Tool group setup used by onModeEnter; extending modes can replace it.
  initToolGroups,
  // The mode's own customizations, referenced by name: the block is registered
  // at default scope when the mode loads (see `customizations` below), and the
  // mode route applies it as the bottom layer of the mode scope on enter.
  modeCustomizations: 'tmtvModeCustomizations',
  activatePanelTriggers: [],

  /**
   * Lifecycle hooks
   */
  onModeEnter,
  onModeExit,
  validationTags: {
    study: [],
    series: [],
  },
  // Data-driven validity: requires both PT and CT, rejects SM, and excludes
  // the demo studies that belong to the preclinical 4D mode.  Until we have a
  // better way to identify 4D studies we use the mrn/StudyInstanceUID.
  isValidMode,
  modeModalities: [['PT', 'CT']],
  excludedModalities: ['SM'],
  excludedStudies: [
    { mrn: 'M1' },
    { studyInstanceUid: '1.3.6.1.4.1.12842.1.1.14.3.20220915.105557.468.2963630849' },
  ],
  routes: [tmtvRoute],
  extensions: extensionDependencies,
  hangingProtocol: tmtv.hangingProtocol,
  sopClassHandlers: [ohif.sopClassHandler],
};

/**
 * Customizations the mode registers (Default scope) when it loads — before
 * the bootstrap phase applies, so bootstrap / `?customization=` modules can
 * modify them before anything reads them.  Values are plain data.
 */
export const customizations = {
  tmtvModeCustomizations: {
    'panelSegmentation.tableMode': 'expanded',
  },
};

/**
 * The mode uses the basic mode's `modeFactory`, which applies
 * immutability-helper commands from `modeConfiguration` onto `modeInstance`,
 * so a site can define a mode that extends this one.
 */
const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
  customizations,
};

export default mode;
export { initToolGroups };
