import SegmentationPanel from './SegmentationPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'Segmentations',
      target: 'example-side-panel',
    },
  ],
  components: [
    {
      id: 'example-side-panel',
      component: SegmentationPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
