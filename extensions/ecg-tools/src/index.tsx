import React from 'react';
import ClinicalViewersDropdown from './components/ClinicalViewersDropdown';
import EmbeddedViewerToggleButton from './components/EmbeddedViewerToggleButton';

const EcgToolsExtension = {
  id: '@custom/extension-ecg-tools',

  preRegistration(_args: any) {
    // no custom services needed; we rely on ServicesManager provided ones
  },

  onModeEnter(_args: any) {
    // nothing to set up on mode entry
  },

  onModeExit(_args: any) {
    // nothing to tear down
  },

  getPanelModule(_args: any) {
    const wrappedPanels = [
      {
        name: 'ecgViewer',
        iconName: 'tab-linear',
        iconLabel: 'ECG',
        label: 'ECG Viewer',
        component: React.lazy(() => import('./panels/PanelEcgViewer')),
      },
    ];
    return wrappedPanels;
  },

  getToolbarModule(_args: any) {
    return [
      {
        name: 'ohif.clinicalViewers',
        defaultComponent: ClinicalViewersDropdown,
      },
      {
        name: 'ohif.embeddedViewerToggle',
        defaultComponent: EmbeddedViewerToggleButton,
      },
    ];
  },

  getCommandsModule(_args: any) {
    return {
      definitions: {
        openEcgViewer: {
          commandFn: () => {
            const url = '/ecg-viewer';
            const next = (window as any)._ohifEmbeddedViewer === url ? null : url;
            (window as any)._ohifEmbeddedViewer = next;
            window.dispatchEvent(new CustomEvent('ohif:embedViewer', { detail: { url: next } }));
          },
          storeContexts: [],
          options: {},
        },
        openFootprint: {
          commandFn: () => {
            const url = '/flatfoot';
            const next = (window as any)._ohifEmbeddedViewer === url ? null : url;
            (window as any)._ohifEmbeddedViewer = next;
            window.dispatchEvent(new CustomEvent('ohif:embedViewer', { detail: { url: next } }));
          },
          storeContexts: [],
          options: {},
        },
        openSmartPaint: {
          commandFn: () => {
            const url = '/smart-paint';
            const next = (window as any)._ohifEmbeddedViewer === url ? null : url;
            (window as any)._ohifEmbeddedViewer = next;
            window.dispatchEvent(new CustomEvent('ohif:embedViewer', { detail: { url: next } }));
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'DEFAULT',
    };
  },
};

export default EcgToolsExtension;
