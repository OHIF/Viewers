import * as cornerstone from '@cornerstonejs/core'
import * as csTools from '@cornerstonejs/tools';
import { updateImageSynchronizer } from '../synchronizers';

const referenceLines = {
  enabled: true,
};

const displayReferenceLines = activeIndex => {
  const enabledElements = cornerstone.getEnabledElements();

  for (let i = 0; i < enabledElements.length; i++) {
    const enabledElement = enabledElements[i];

    // Check if element is already enabled and it's image was rendered
    if (!enabledElement || !enabledElement.image) {
      // log.info(
      //   "displayReferenceLines enabled element is undefined or it's image is not rendered"
      // );
      continue;
    }

    const imageId = enabledElement.image.imageId;
    const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

    // Disable reference lines for the current element
    if (activeIndex === i) {
      csTools.setToolDisabledForElement(
        enabledElement.element,
        'ReferenceLines'
      );
      continue;
    }

    if (!referenceLines.enabled) {
      csTools.setToolDisabledForElement(
        enabledElement.element,
        'ReferenceLines'
      );
      continue;
    }

    if (!imagePlane || !imagePlane.frameOfReferenceUID) {
      // log.info(
      //   'displayReferenceLines refLinesEnabled is not enabled, no imagePlane or no frameOfReferenceUID'
      // );
      continue;
    }

    // Enable reference lines for the other elements
    csTools.setToolEnabledForElement(enabledElement.element, 'ReferenceLines', {
      synchronizationContext: updateImageSynchronizer,
    });
  }
};

referenceLines.display = displayReferenceLines;

export { referenceLines };
