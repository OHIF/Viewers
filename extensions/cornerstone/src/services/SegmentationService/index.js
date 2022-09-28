import SegmentationService from './SegmentationService';

export default function ExtendedSegmentationService(serviceManager) {
  return {
    name: 'SegmentationService',
    create: ({ configuration = {} }) => {
      return new SegmentationService(serviceManager);
    },
  };
}
