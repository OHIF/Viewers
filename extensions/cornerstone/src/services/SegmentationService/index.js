import SegmentationService from './SegmentationService';

export default function ExtendedSegmentationService(servicesManager) {
  return {
    name: 'SegmentationService',
    create: ({ configuration = {} }) => {
      return new SegmentationService({ servicesManager });
    },
  };
}
