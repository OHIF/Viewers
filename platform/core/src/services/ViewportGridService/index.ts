import ViewportGridService from './ViewportGridService';

const ViewportGridServiceRegistration = {
  name: 'viewportGridService',
  altName: 'ViewportGridService',
  create: ({ configuration = {} }) => {
    return new ViewportGridService();
  },
};

export { ViewportGridService, ViewportGridServiceRegistration };
