import React from 'react';
import PanelStudyNotes from './PanelStudyNotes';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: '@ohif/extension-study-notes',

  /**
   * Register the Study Notes Panel
   */
  getPanelModule: ({ servicesManager, commandsManager, extensionManager }) => {
    return [
      {
        name: 'panelStudyNotes',
        iconName: 'tab-patient-info',
        iconLabel: 'Notes',
        label: 'Study Notes',
        component: (props) => (
          <PanelStudyNotes
            {...props}
            servicesManager={servicesManager}
            commandsManager={commandsManager}
          />
        ),
      },
    ];
  },
};
