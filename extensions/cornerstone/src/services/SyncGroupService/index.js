import SyncGroupService from './SyncGroupService';

export default function ExtendedSyncGroupService(serviceManager) {
  return {
    altName: 'SyncGroupService',
    name: 'syncGroupService',
    create: ({ configuration = {} }) => {
      return new SyncGroupService(serviceManager);
    },
  };
}
