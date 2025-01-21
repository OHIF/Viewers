import DataSourceSelector from '../Panels/DataSourceSelector';

export default {
  customRoutes: {
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
