import i18n from 'i18next';
import { ToolbarService } from '@ohif/core';
import { id } from './id';
import {
  initToolGroups,
  toolbarButtons as basicToolbarButtons,
  toolbarSections as basicToolbarSections,
  onModeExit as basicOnModeExit,
  onModeEnter as basicOnModeEnter,
  cornerstone,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
} from '@ohif/mode-basic';
import dentalTranslations from './i18n/locales/en-US/Modes.json';
import { registerDentalMappings } from '@ohif/extension-24x7-dental-ui/src/measurements/registerDentalMappings';

const { TOOLBAR_SECTIONS } = ToolbarService;

const namespaces = ['en-US', 'en-GB', 'en'];
namespaces.forEach(locale => {
  i18n.addResourceBundle(locale, 'Modes', dentalTranslations, true, true);
});

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const dental = {
  measurements: '@ohif/extension-24x7-dental-ui.panelModule.dentalMeasurements',
  trackedMeasurements: '@ohif/extension-24x7-dental-ui.panelModule.trackedMeasurementsNoDental',
  viewerLayout: '@ohif/extension-24x7-dental-ui.layoutTemplateModule.dentalViewerLayout',
};

export const extensionDependencies = {
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-24x7-dental-ui': '^1.0.0',
};

export const dentalInstance = {
  ...basicLayout,
  id: dental.viewerLayout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: [cornerstone.segmentation, dental.trackedMeasurements, dental.measurements],
    viewports: [
      {
        namespace: tracked.viewport,
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
    ],
  },
};

export const dentalRoute = {
  ...basicRoute,
  path: 'dental',
  layoutInstance: dentalInstance,
};

const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const dentalThemeToggleButton = {
  id: 'DentalThemeToggle',
  uiType: 'dental.themeToggle',
  props: {},
} as const;

const dentalBrandTitleButton = {
  id: 'DentalBrandTitle',
  uiType: 'dental.brandTitle',
  props: {},
} as const;

const toothSelectorButton = {
  id: 'ToothSelector',
  uiType: 'dental.toothSelector',
  props: {},
} as const;

const dentalToolsSectionButton = {
  id: 'DentalTools',
  uiType: 'ohif.toolButtonList',
  props: {
    buttonSection: true,
  },
};

const paLengthButton = {
  id: 'PALength',
  uiType: 'ohif.toolButton',
  props: {
    icon: 'tool-length',
    label: 'PA Length',
    tooltip: 'PA Length Tool',
    commands: setToolActiveToolbar,
    evaluate: 'evaluate.cornerstoneTool',
  },
};

const canalAngleButton = {
  id: 'CanalAngle',
  uiType: 'ohif.toolButton',
  props: {
    icon: 'tool-angle',
    label: 'Canal Angle',
    tooltip: 'Canal Angle Tool',
    commands: setToolActiveToolbar,
    evaluate: 'evaluate.cornerstoneTool',
  },
};

const crownWidthButton = {
  id: 'CrownWidth',
  uiType: 'ohif.toolButton',
  props: {
    icon: 'tool-length',
    label: 'Crown Width (mm)',
    tooltip: 'Crown Width Tool',
    commands: setToolActiveToolbar,
    evaluate: 'evaluate.cornerstoneTool',
  },
};

const rootLengthButton = {
  id: 'RootLength',
  uiType: 'ohif.toolButton',
  props: {
    icon: 'tool-length',
    label: 'Root Length (mm)',
    tooltip: 'Root Length Tool',
    commands: setToolActiveToolbar,
    evaluate: 'evaluate.cornerstoneTool',
  },
};

export const toolbarButtons = [
  ...basicToolbarButtons,
  dentalThemeToggleButton,
  dentalBrandTitleButton,
  toothSelectorButton,
  dentalToolsSectionButton,
  paLengthButton,
  canalAngleButton,
  crownWidthButton,
  rootLengthButton,
];

export const toolbarSections = {
  ...basicToolbarSections,
  [TOOLBAR_SECTIONS.secondary]: ['DentalBrandTitle'],
  [TOOLBAR_SECTIONS.primary]: [
    ...basicToolbarSections[TOOLBAR_SECTIONS.primary],
    'DentalTools',
    'ToothSelector',
    'DentalThemeToggle',
  ],
  DentalTools: ['PALength', 'CanalAngle', 'CrownWidth', 'RootLength'],
};

const DENTAL_TOOL_BASE_LABELS: Record<string, string> = {
  PALength: 'PA Length',
  CanalAngle: 'Canal Angle',
  CrownWidth: 'Crown Width',
  RootLength: 'Root Length',
};

function onModeEnter(this: typeof modeInstance, args: withAppTypes): void {
  // Run all basic-mode initialisation (tool groups, toolbar registration, etc.)
  basicOnModeEnter.call(this, args);

  const servicesManager = args?.servicesManager;
  if (!servicesManager) return;

  const measurementService = servicesManager.services?.measurementService as any;
  const toolGroupService = servicesManager.services?.toolGroupService as any;
  const panelService = servicesManager.services?.panelService as any;

  registerDentalMappings(measurementService, servicesManager);

  const dentalTools: any = {
    passive: [
      { toolName: 'PALength' },
      { toolName: 'CanalAngle' },
      { toolName: 'CrownWidth' },
      { toolName: 'RootLength' },
    ],
  };

  if (toolGroupService) {
    for (const groupId of ['default', 'mpr']) {
      try {
        toolGroupService.addToolsToToolGroup(groupId, dentalTools);
      } catch {
        // silently skip.
      }
    }
  }

  if (!measurementService) return;

  const { unsubscribe } = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_ADDED,
    (data: any) => {
      const { measurement } = data;
      const { toolName, uid } = measurement;
      const baseLabel = DENTAL_TOOL_BASE_LABELS[toolName];
      if (!baseLabel) return;

      const count: number = measurementService
        .getMeasurements()
        .filter((m: any) => m.toolName === toolName).length;

      measurementService.update(uid, { ...measurement, label: `${baseLabel} ${count}` }, true);
    }
  );

  const panelTriggerSubs =
    panelService?.addActivatePanelTriggers(
      dental.measurements,
      [
        {
          sourcePubSubService: measurementService,
          sourceEvents: [measurementService.EVENTS.MEASUREMENT_ADDED],
        },
      ],
      false
    ) ?? [];
  (this as any)._dentalSubscriptions = [
    unsubscribe,
    ...panelTriggerSubs.map((s: any) => s.unsubscribe ?? s),
  ];
}

function onModeExit(this: typeof modeInstance, args: withAppTypes): void {
  const subs = (this as any)._dentalSubscriptions as Array<() => void>;
  if (subs?.length) {
    subs.forEach(unsub => typeof unsub === 'function' && unsub());
    (this as any)._dentalSubscriptions = [];
  }
  basicOnModeExit.call(this, args);
  document.documentElement.classList.remove('dental-theme');
}

export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'dental',
  displayName: i18n.t('Modes:Dental View'),
  hangingProtocol: '@24x7-dental-ui/hp2x2',
  config: {
    ...basicModeInstance.config,
    showPatientInfo: 'visible',
  },
  routes: [dentalRoute],
  extensions: extensionDependencies,
  toolbarButtons,
  toolbarSections,
  onModeEnter,
  onModeExit,
  _dentalSubscriptions: [] as Array<() => void>,
};

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups };
