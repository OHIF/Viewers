import SegmentationService from './SegmentationService';

export default {
  name: 'SegmentationService',
  create: ({ configuration = {} }) => {
    return new SegmentationService();
  },
};
