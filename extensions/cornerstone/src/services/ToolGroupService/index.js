import ToolGroupService from './ToolGroupService';

export default function ExtendedToolGroupService(serviceManager) {
  return {
    name: 'ToolGroupService',
    create: ({ configuration = {} }) => {
      return new ToolGroupService(serviceManager);
    },
  };
}
