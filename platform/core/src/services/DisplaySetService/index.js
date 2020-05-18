import DisplaySetService from './DisplaySetService';

export default {
  name: 'DisplaySetService',
  create: ({ configuration = {} }) => {
    return new DisplaySetService();
  },
};
