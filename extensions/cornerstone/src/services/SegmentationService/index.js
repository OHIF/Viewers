import SegmentationService from './SegmentationService';

export default function ExtendedSegmentationService(servicesManager) {
  return {
    name: 'segmentationService',
    altName: 'SegmentationService',
    create: ({ configuration = {} }) => {
      return new SegmentationService({ servicesManager });
    },
  };
}
