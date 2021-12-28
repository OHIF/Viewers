import HangingProtocolService from './HangingProtocolService';

export default {
  name: 'HangingProtocolService',
  create: ({ configuration = {}, commandsManager }) => {
    return new HangingProtocolService(commandsManager);
  },
};
