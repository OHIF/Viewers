import React from 'react';
import { id } from './id';
import DentalBrandTitle from './components/DentalBrandTitle';
import DentalThemeToggleButton from './components/DentalThemeToggleButton';
import ToothSelectorButton from './components/ToothSelectorButton';
import hpDental2x2 from './hangingProtocols/hpDental2x2';
import { createDentalViewerLayout } from './layouts/DentalViewerLayout';
import { dentalThemeManager } from './dentalThemeManager';
import './styles/dental-theme.css';
import { addTool } from '@cornerstonejs/tools';
import { Icons } from '@ohif/ui-next';
import TabDentalMeasurements from './components/TabDentalMeasurements';
import PanelDentalMeasurements from './panels/PanelDentalMeasurements';
import PanelTrackedMeasurementsNoDental from './panels/PanelTrackedMeasurementsNoDental';
import PALengthTool from './tools/PALengthTool';
import CanalAngleTool from './tools/CanalAngleTool';
import CrownWidthTool from './tools/CrownWidthTool';
import RootLengthTool from './tools/RootLengthTool';

export default {
  id,
  preRegistration() {
    addTool(PALengthTool);
    addTool(CanalAngleTool);
    addTool(CrownWidthTool);
    addTool(RootLengthTool);
    Icons.addIcon('tab-dental-measurements', TabDentalMeasurements);
  },
  onModeExit(): void {
    dentalThemeManager.reset();
  },
  getToolbarModule(): Array<{ name: string; defaultComponent: React.ComponentType }> {
    return [
      {
        name: 'dental.themeToggle',
        defaultComponent: DentalThemeToggleButton,
      },
      {
        name: 'dental.brandTitle',
        defaultComponent: DentalBrandTitle,
      },
      {
        name: 'dental.toothSelector',
        defaultComponent: ToothSelectorButton,
      },
    ];
  },
  getPanelModule({
    commandsManager,
    extensionManager,
    servicesManager,
  }: {
    commandsManager: any;
    extensionManager: any;
    servicesManager: any;
  }) {
    return [
      {
        name: 'dentalMeasurements',
        iconName: 'tab-dental-measurements',
        iconLabel: 'Dental',
        label: 'Dental Measurements',
        component: (props: any) => (
          <PanelDentalMeasurements
            {...props}
            key="dentalMeasurements-panel"
            commandsManager={commandsManager}
            extensionManager={extensionManager}
            servicesManager={servicesManager}
          />
        ),
      },
      {
        name: 'trackedMeasurementsNoDental',
        iconName: 'tab-linear',
        iconLabel: 'Measure',
        label: 'Measurements',
        component: (props: any) => (
          <PanelTrackedMeasurementsNoDental
            {...props}
            key="trackedMeasurementsNoDental-panel"
            commandsManager={commandsManager}
            extensionManager={extensionManager}
            servicesManager={servicesManager}
          />
        ),
      },
    ];
  },
  getViewportModule: () => [],
  getLayoutTemplateModule({ extensionManager }: { extensionManager: any }) {
    return [
      {
        name: 'dentalViewerLayout',
        id: 'dentalViewerLayout',
        component: createDentalViewerLayout(extensionManager),
      },
    ];
  },
  getSopClassHandlerModule: () => [],
  getHangingProtocolModule: () => [
    {
      name: hpDental2x2.id,
      protocol: hpDental2x2,
    },
  ],
  getCommandsModule: () => [],
  getContextModule: () => [],
  getDataSourcesModule: () => [],
};

export { dentalThemeManager };
