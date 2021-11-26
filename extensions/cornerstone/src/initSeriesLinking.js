import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { getEnabledElement } from './state';
import waitForTheImageToBeRendered from './utils/waitForTheImageToBeRendered';

const convertToVector3 = csTools.importInternal('util/convertToVector3');

const initSeriesLinking = ({ servicesManager, commandsManager }) => {
  const updateSeriesLinking = ({ detail: { enabledElement } }) => {
    const {
      ViewportGridService,
      ViewerToolsetService,
    } = servicesManager.services;
    const { activeViewportIndex } = ViewportGridService.getState();
    const { isSeriesLinkingEnabled } = ViewerToolsetService.getState();

    if (
      !isSeriesLinkingEnabled ||
      getEnabledElement(activeViewportIndex).element !== enabledElement.element
    )
      return;

    const sourceElement = enabledElement;
    const sourceImage = sourceElement.image;
    cornerstone
      .getEnabledElements()
      .filter(e => e.uuid !== sourceElement.uuid)
      .forEach(async targetElement => {
        if (!targetElement.image)
          await waitForTheImageToBeRendered(targetElement.element);

        const targetImage = targetElement.image;

        if (!sourceImage || !targetImage) {
          return;
        }

        const sourceImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          sourceImage.imageId
        );
        const targetImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          targetImage.imageId
        );
        // Make sure the source and target actually have image plane metadata
        if (
          !sourceImagePlane ||
          !targetImagePlane ||
          !sourceImagePlane.rowCosines ||
          !sourceImagePlane.columnCosines ||
          !sourceImagePlane.imagePositionPatient ||
          !targetImagePlane.rowCosines ||
          !targetImagePlane.columnCosines ||
          !targetImagePlane.imagePositionPatient
        ) {
          return;
        }

        sourceImagePlane.rowCosines = convertToVector3(
          sourceImagePlane.rowCosines
        );
        sourceImagePlane.columnCosines = convertToVector3(
          sourceImagePlane.columnCosines
        );
        sourceImagePlane.imagePositionPatient = convertToVector3(
          sourceImagePlane.imagePositionPatient
        );
        targetImagePlane.rowCosines = convertToVector3(
          targetImagePlane.rowCosines
        );
        targetImagePlane.columnCosines = convertToVector3(
          targetImagePlane.columnCosines
        );
        targetImagePlane.imagePositionPatient = convertToVector3(
          targetImagePlane.imagePositionPatient
        );

        // The image plane normals must be > 30 degrees apart
        const sourceNormal = sourceImagePlane.rowCosines
          .clone()
          .cross(sourceImagePlane.columnCosines);
        const targetNormal = targetImagePlane.rowCosines
          .clone()
          .cross(targetImagePlane.columnCosines);
        let angleInRadians = sourceNormal.angleTo(targetNormal);
        angleInRadians = Math.abs(angleInRadians);

        if (angleInRadians !== 0) {
          return;
        }

        const sourceStack = csTools.getToolState(
          sourceElement.element,
          'stack'
        );
        const targetStack = csTools.getToolState(
          targetElement.element,
          'stack'
        );

        if (!sourceStack || !targetStack) {
          return;
        }

        const sourceStackData = sourceStack.data[0];
        const targetStackData = targetStack.data[0];

        const newImageIdIndex = Math.floor(
          targetStackData.imageIds.length *
            (sourceStackData.currentImageIdIndex /
              sourceStackData.imageIds.length)
        );

        if (newImageIdIndex === targetStackData.currentImageIdIndex) {
          return;
        }

        const startLoadingHandler = csTools.loadHandlerManager.getStartLoadHandler(
          targetElement.element
        );
        const endLoadingHandler = csTools.loadHandlerManager.getEndLoadHandler(
          targetElement.element
        );
        const errorLoadingHandler = csTools.loadHandlerManager.getErrorLoadingHandler(
          targetElement.element
        );

        if (startLoadingHandler) {
          startLoadingHandler(targetElement.element);
        }

        let loader;

        if (targetStackData.preventCache === true) {
          loader = cornerstone.loadImage(
            targetStackData.imageIds[newImageIdIndex]
          );
        } else {
          loader = cornerstone.loadAndCacheImage(
            targetStackData.imageIds[newImageIdIndex]
          );
        }

        loader.then(
          function(image) {
            const viewport = cornerstone.getViewport(targetElement.element);

            targetStackData.currentImageIdIndex = newImageIdIndex;
            cornerstone.displayImage(targetElement.element, image, viewport);
            if (endLoadingHandler) {
              endLoadingHandler(targetElement.element, image);
            }
          },
          function(error) {
            const imageId = targetStackData.imageIds[newImageIdIndex];

            if (errorLoadingHandler) {
              errorLoadingHandler(targetElement, imageId, error);
            }
          }
        );
      });
  };

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    event => {
      event.detail.element.addEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        updateSeriesLinking
      );
    }
  );

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    event => {
      event.detail.element.removeEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        updateSeriesLinking
      );
    }
  );
};

export default initSeriesLinking;
