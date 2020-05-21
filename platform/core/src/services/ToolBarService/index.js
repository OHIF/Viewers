import ToolBarService from './ToolBarService';

export default {
  name: 'ToolBarService',
  create: ({ configuration = {} }) => {
    return new ToolBarService();
  },
};
