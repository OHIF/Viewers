import ExampleSidePanel from './ExampleSidePanel.js';

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
      component: ExampleSidePanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
