import * as actions from './actions';

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}) => {
  const appContext = {
    servicesManager,
    commandsManager,
    extensionManager,
  };

  const wrapAction = fnAction => (...params) => fnAction(appContext, ...params);

  const definitions = {
    updateSegmentationsChartDisplaySet: {
      commandFn: wrapAction(actions.updateSegmentationsChartDisplaySet),
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
