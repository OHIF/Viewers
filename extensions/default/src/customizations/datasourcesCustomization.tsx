import DataSourceSelector from '../Panels/DataSourceSelector';

export default {
  'routes.customRoutes': {
    routes: {
      $push: [
        {
          path: '/datasources',
          children: DataSourceSelector,
        },
      ],
    },
  },
};
