import SyncGroupService from './SyncGroupService';

export default function ExtendedSyncGroupService(serviceManager) {
  return {
    name: 'SyncGroupService',
    create: ({ configuration = {} }) => {
      return new SyncGroupService(serviceManager);
    },
  };
}
