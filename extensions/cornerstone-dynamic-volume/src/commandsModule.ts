import * as actions from './actions';

const commandsModule = () => {
  const definitions = {
    updateSegmentationsChartDisplaySet: {
      commandFn: actions.updateSegmentationsChartDisplaySet,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DYNAMIC-VOLUME:CORNERSTONE',
  };
};

export default commandsModule;
