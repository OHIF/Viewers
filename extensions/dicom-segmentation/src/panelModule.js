import SegmentationPanel from './components/SegmentationPanel/SegmentationPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'Segmentations',
      target: 'segmentation-panel',
      isDisabled: studies => {
        if (!studies) {
          return true;
        }

        for (let i = 0; i < studies.length; i++) {
          const study = studies[i];

          if (study && study.series) {
            for (let j = 0; j < study.series.length; j++) {
              const series = study.series[j];

              if (series.Modality === 'SEG') {
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
      id: 'segmentation-panel',
      component: SegmentationPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
