import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';

const convertToVector3 = csTools.importInternal('util/convertToVector3');
const imagePointToPatientPoint = csTools.importInternal(
  'util/imagePointToPatientPoint'
);

export default class NLCrosshairsTool extends csTools.CrosshairsTool {
  constructor(props = {}) {
    super({
      name: 'NLCrosshairs',
      supportedInteractionTypes: ['Mouse', 'Touch'],
    });
  }

  _chooseLocation(evt) {
    const eventData = evt.detail;
    const { element } = eventData;

    // Prevent CornerstoneToolsTouchStartActive from killing any press events
    evt.stopImmediatePropagation();

    // If we have no toolData for this element, return immediately as there is nothing to do
    const toolData = csTools.getToolState(element, this.name);

    if (!toolData) {
      return;
    }

    // Get current element target information
    const sourceElement = element;
    const sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);
    const sourceImageId = sourceEnabledElement.image.imageId;
    const sourceImagePlane = cornerstone.metaData.get(
      'imagePlaneModule',
      sourceImageId
    );

    if (!sourceImagePlane) {
      return;
    }

    // Get currentPoints from mouse cursor on selected element
    const sourceImagePoint = eventData.currentPoints.image;

    // Transfer this to a patientPoint given imagePlane metadata
    const patientPoint = imagePointToPatientPoint(
      sourceImagePoint,
      sourceImagePlane
    );

    // Get the enabled elements associated with this synchronization context
    const syncContext = toolData.data[0].synchronizationContext;
    const enabledElements = syncContext.getSourceElements();

    // Iterate over each synchronized element
    enabledElements.forEach(function(targetElement) {
      // Don't do anything if the target is the same as the source
      if (targetElement === sourceElement) {
        return;
      }

      const targetEnabledElement = cornerstone.getEnabledElement(targetElement);
      const sourceInstance = cornerstone.metaData.get(
        'instance',
        sourceImageId
      );
      const targetInstance = cornerstone.metaData.get(
        'instance',
        targetEnabledElement.image.imageId
      );

      if (sourceInstance.StudyInstanceUID !== targetInstance.StudyInstanceUID) {
        return;
      }

      let minDistance = Number.MAX_VALUE;
      let newImageIdIndex = -1;

      const stackToolDataSource = csTools.getToolState(targetElement, 'stack');

      if (stackToolDataSource === undefined) {
        return;
      }

      const stackData = stackToolDataSource.data[0];

      // Find within the element's stack the closest image plane to selected location
      stackData.imageIds.forEach(function(imageId, index) {
        const imagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          imageId
        );

        // Skip if the image plane is not ready
        if (
          !imagePlane ||
          !imagePlane.imagePositionPatient ||
          !imagePlane.rowCosines ||
          !imagePlane.columnCosines
        ) {
          return;
        }

        const imagePosition = convertToVector3(imagePlane.imagePositionPatient);
        const row = convertToVector3(imagePlane.rowCosines);
        const column = convertToVector3(imagePlane.columnCosines);
        const normal = column.clone().cross(row.clone());
        const distance = Math.abs(
          normal.clone().dot(imagePosition) - normal.clone().dot(patientPoint)
        );

        if (distance < minDistance) {
          minDistance = distance;
          newImageIdIndex = index;
        }
      });

      if (newImageIdIndex === stackData.currentImageIdIndex) {
        return;
      }

      // Switch the loaded image to the required image
      if (
        newImageIdIndex !== -1 &&
        stackData.imageIds[newImageIdIndex] !== undefined
      ) {
        const startLoadingHandler = csTools.loadHandlerManager.getStartLoadHandler(
          targetElement
        );
        const endLoadingHandler = csTools.loadHandlerManager.getEndLoadHandler(
          targetElement
        );
        const errorLoadingHandler = csTools.loadHandlerManager.getErrorLoadingHandler(
          targetElement
        );

        if (startLoadingHandler) {
          startLoadingHandler(targetElement);
        }

        let loader;

        if (stackData.preventCache === true) {
          loader = cornerstone.loadImage(stackData.imageIds[newImageIdIndex]);
        } else {
          loader = cornerstone.loadAndCacheImage(
            stackData.imageIds[newImageIdIndex]
          );
        }

        loader.then(
          function(image) {
            const viewport = cornerstone.getViewport(targetElement);

            stackData.currentImageIdIndex = newImageIdIndex;
            cornerstone.displayImage(targetElement, image, viewport);
            if (endLoadingHandler) {
              endLoadingHandler(targetElement, image);
            }
          },
          function(error) {
            const imageId = stackData.imageIds[newImageIdIndex];

            if (errorLoadingHandler) {
              errorLoadingHandler(targetElement, imageId, error);
            }
          }
        );
      }
    });
  }
}
