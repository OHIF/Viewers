import ToolBarService from './ToolBarService';

export default {
  name: 'ToolBarService',
  create: ({ configuration = {}, commandsManager }) => {
    return new ToolBarService(commandsManager);
  },
};
