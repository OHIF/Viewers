import CustomizationService from './CustomizationService';

const CustomizationServiceRegistration = {
  name: 'customizationService',
  create: ({ configuration = {}, commandsManager }) => {
    return new CustomizationService({ configuration, commandsManager });
  },
};

export default CustomizationServiceRegistration;
export { CustomizationService, CustomizationServiceRegistration };
