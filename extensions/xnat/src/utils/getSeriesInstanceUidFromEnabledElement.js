import * as cornerstone from '@cornerstonejs/core'

export default function getSeriesInstanceUidFromEnabledElement(enabledElement) {
  if (!enabledElement) {
    return;
  }

  const imageId = enabledElement.image.imageId;
  const generalSeriesModule = cornerstone.metaData.get(
    'generalSeriesModule',
    imageId
  );

  return generalSeriesModule.seriesInstanceUID;
}
