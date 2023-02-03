import ToolbarService from './ToolBarService';

const ToolbarServiceRegistration = {
  name: 'toolbarService',
  altName: 'ToolBarService',
  create: ({ configuration = {}, commandsManager }) => {
    return new ToolbarService(commandsManager);
  },
};

export default ToolbarServiceRegistration;
export { ToolbarService, ToolbarServiceRegistration };
