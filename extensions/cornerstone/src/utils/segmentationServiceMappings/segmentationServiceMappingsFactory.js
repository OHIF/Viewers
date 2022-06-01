import Labelmap from './Labelmap';

const segmentationServiceMappingsFactory = (
  SegmentationService,
  DisplaySetService
) => {
  return {
    Labelmap: {
      matchingCriteria: {},
      toSegmentation: csToolsSegmentation =>
        Labelmap.toSegmentation(csToolsSegmentation, DisplaySetService),
    },
  };
};

export default segmentationServiceMappingsFactory;
