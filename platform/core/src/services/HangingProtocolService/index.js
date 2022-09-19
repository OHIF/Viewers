import HangingProtocolService from './HangingProtocolService';

export default {
  name: 'HangingProtocolService',
  create: ({ configuration = {}, commandsManager, servicesManager }) => {
    return new HangingProtocolService(commandsManager, servicesManager);
  },
};
