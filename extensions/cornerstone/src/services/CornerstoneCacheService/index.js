import CornerstoneCacheService from './CornerstoneCacheService';

export default function ExtendedCornerstoneCacheService(serviceManager) {
  return {
    name: 'CornerstoneCacheService',
    create: ({ configuration = {} }) => {
      return new CornerstoneCacheService(serviceManager);
    },
  };
}
