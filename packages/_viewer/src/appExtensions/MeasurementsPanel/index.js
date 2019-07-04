import ConnectedMeasurementTable from './ConnectedMeasurementTable.js';

export default {
  id: 'measurements-table',
  getPanelModule() {
    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Measurements',
          target: 'measurement-panel',
        },
      ],
      components: [
        {
          id: 'measurement-panel',
          component: ConnectedMeasurementTable,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
