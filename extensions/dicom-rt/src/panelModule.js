import RTPanel from './components/RTPanel/RTPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'RTSTRUCT',
      target: 'rt-panel',
      isDisabled: studies => {
        if (!studies) {
          return true;
        }

        for (let i = 0; i < studies.length; i++) {
          const study = studies[i];

          if (study && study.series) {
            for (let j = 0; j < study.series.length; j++) {
              const series = study.series[j];

              if (series.Modality === 'RTSTRUCT') {
                return false;
              }
            }
          }
        }

        return true;
      },
    },
  ],
  components: [
    {
      id: 'rt-panel',
      component: RTPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
