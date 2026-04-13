import React from 'react';
import { id } from './id';
import DentalBrandTitle from './components/DentalBrandTitle';
import DentalThemeToggleButton from './components/DentalThemeToggleButton';
import ToothSelectorButton from './components/ToothSelectorButton';
import hpDental2x2 from './hangingProtocols/hpDental2x2';
import { createDentalViewerLayout } from './layouts/DentalViewerLayout';
import { dentalThemeManager } from './dentalThemeManager';
import './styles/dental-theme.css';

export default {
  id,
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
  getPanelModule: () => [],
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
