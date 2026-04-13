import React from 'react';
import { id } from './id';
import DentalThemeToggleButton from './components/DentalThemeToggleButton';
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
    ];
  },
  getPanelModule: () => [],
  getViewportModule: () => [],
  getLayoutTemplateModule: () => [],
  getSopClassHandlerModule: () => [],
  getHangingProtocolModule: () => [],
  getCommandsModule: () => [],
  getContextModule: () => [],
  getDataSourcesModule: () => [],
};

export { dentalThemeManager };
