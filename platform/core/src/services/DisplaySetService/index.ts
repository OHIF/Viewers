import DisplaySetService from './DisplaySetService';

const DisplaySetServiceRegistration = {
  name: 'DisplaySetService',
  create: ({ configuration = {} }) => {
    return new DisplaySetService();
  },
};

export default DisplaySetServiceRegistration;
export { DisplaySetService, DisplaySetServiceRegistration };
