import MRUrographyPanel from './components/MRUrographyPanel.js';

export default {
  menuOptions: [
    {
      icon: 'list',
      label: 'Urography',
      target: 'kinderspital-mr-urography-panel',
      isDisabled: studies => {
        const pathname = window.location.pathname;

        if (!pathname.includes('mrUrography')) {
          return true;
        }

        return false;
      },
    },
  ],
  components: [
    {
      id: 'kinderspital-mr-urography-panel',
      component: MRUrographyPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
