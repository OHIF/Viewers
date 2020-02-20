import SegmentationPanel from './components/SegmentationPanel/SegmentationPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'Segmentations',
      target: 'segmentation-panel',
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
