import ConnectedMeasurementTable from './connectedComponents/ConnectedMeasurementTable.js';

export default {
  id: 'measurements-table',
  getPanelModule() {
    return {
      menuOptions: [
        {
          icon: 'circle',
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
