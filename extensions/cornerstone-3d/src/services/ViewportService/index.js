import ViewportService from './ViewportService';

export default function ExtendedViewportService(serviceManager) {
  return {
    name: 'ViewportService',
    create: ({ configuration = {} }) => {
      return new ViewportService(serviceManager);
    },
  };
}
