import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';

const { computeRotation } = OHIF.utils;

const checkAndFixVoi = image => {
  const instance = cornerstone.metaData.get('instance', image.imageId);
  if (isNaN(image.windowCenter) || isNaN(image.windowWidth)) {
    const { WindowCenter, WindowWidth } = instance;
    image.windowCenter = WindowCenter || 80;
    image.windowWidth = WindowWidth || 400;
  }

  // Compute projection angle
  let angle = 0;
  if (instance.ImageOrientationSlide) {
    if (instance.ImageType && instance.ImageType[2] !== 'LABEL') {
      angle = computeRotation(instance.ImageOrientationSlide);
    }
  }
  image.angle = angle;
};

export default checkAndFixVoi;
