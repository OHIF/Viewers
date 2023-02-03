import HangingProtocolService from './HangingProtocolService';

const HangingProtocolServiceRegistration = {
  name: 'hangingProtocolService',
  altName: 'HangingProtocolService',
  create: ({ configuration = {}, commandsManager, servicesManager }) => {
    return new HangingProtocolService(commandsManager, servicesManager);
  },
};

export { HangingProtocolService, HangingProtocolServiceRegistration };
