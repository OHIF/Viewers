import { Types } from '@ohif/core';
import { id } from './id';
import getPanelModule from './getPanelModule';
import getCommandsModule from './getCommandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import './dental-theme.css';

/**
 * Dental Theme Toggle Extension
 *
 * Provides theme switching functionality optimized for dental imaging workflows.
 * Includes both light and dark themes with dental-specific color optimizations.
 */
const dentalThemeToggleExtension: Types.Extensions.Extension = {
  /**
   * Unique extension identifier
   */
  id,

  /**
   * Pre-registration hook - Initialize theme on startup
   */
  preRegistration: ({ servicesManager }: Types.Extensions.ExtensionParams) => {
    // Apply saved theme on initialization
    const savedTheme = localStorage.getItem('viewerTheme');
    const rootElement = document.documentElement;

    if (savedTheme === 'dental') {
      rootElement.classList.add('dental-theme');
      rootElement.classList.remove('ohif-theme');
    } else {
      // Default to OHIF theme if no preference is saved
      rootElement.classList.add('ohif-theme');
      rootElement.classList.remove('dental-theme');
      if (!savedTheme) {
        localStorage.setItem('viewerTheme', 'ohif');
      }
    }
  },

  /**
   * On mode exit - Clean up if needed
   */
  onModeExit: () => {
    // Optional: Reset to default theme or keep user preference
    // Currently keeping user preference persistent
  },

  /**
   * Panel module registration
   */
  getPanelModule,

  /**
   * Commands module registration
   */
  getCommandsModule,

  /**
   * Hanging protocol module registration
   */
  getHangingProtocolModule,
};

export default dentalThemeToggleExtension;
