import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { getEnabledElement } from './state';
import waitForTheImageToBeRendered from './utils/waitForTheImageToBeRendered';

const draw = csTools.importInternal('drawing/draw');
const drawLine = csTools.importInternal('drawing/drawLine');
const convertToVector3 = csTools.importInternal('util/convertToVector3');
const planeIntersection = csTools.importInternal('util/planePlaneIntersection');
const projectPatientPointToImagePlane = csTools.importInternal(
  'util/projectPatientPointToImagePlane'
);
const getNewContext = csTools.importInternal('drawing/getNewContext');

const enableReferenceLines = () => {
  const renderReferenceLines = ({ detail: { enabledElement } }) => {
    const { activeViewportIndex } = window.store.getState().viewports;

    if (getEnabledElement(activeViewportIndex) !== enabledElement.element)
      return;

    const targetImage = enabledElement.image;
    cornerstone
      .getEnabledElements()
      .filter(e => e.uuid !== enabledElement.uuid)
      .forEach(async referenceElement => {
        if (!referenceElement.image)
          await waitForTheImageToBeRendered(referenceElement.element);

        const referenceImage = referenceElement.image;

        if (!referenceImage || !targetImage) {
          console.warn(
            'Could not render reference lines, one or more images not defined.'
          );
          return;
        }

        const targetImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          targetImage.imageId
        );
        const referenceImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          referenceImage.imageId
        );
        // Make sure the target and reference actually have image plane metadata
        if (
          !targetImagePlane ||
          !referenceImagePlane ||
          !targetImagePlane.rowCosines ||
          !targetImagePlane.columnCosines ||
          !targetImagePlane.imagePositionPatient ||
          !referenceImagePlane.rowCosines ||
          !referenceImagePlane.columnCosines ||
          !referenceImagePlane.imagePositionPatient
        ) {
          console.warn(
            'Could not render reference lines, image plane modules not defined.'
          );
          return;
        }

        if (
          targetImagePlane.frameOfReferenceUID !==
          referenceImagePlane.frameOfReferenceUID
        ) {
          return;
        }

        targetImagePlane.rowCosines = convertToVector3(
          targetImagePlane.rowCosines
        );
        targetImagePlane.columnCosines = convertToVector3(
          targetImagePlane.columnCosines
        );
        targetImagePlane.imagePositionPatient = convertToVector3(
          targetImagePlane.imagePositionPatient
        );
        referenceImagePlane.rowCosines = convertToVector3(
          referenceImagePlane.rowCosines
        );
        referenceImagePlane.columnCosines = convertToVector3(
          referenceImagePlane.columnCosines
        );
        referenceImagePlane.imagePositionPatient = convertToVector3(
          referenceImagePlane.imagePositionPatient
        );
        // The image plane normals must be > 30 degrees apart
        const targetNormal = targetImagePlane.rowCosines
          .clone()
          .cross(targetImagePlane.columnCosines);
        const referenceNormal = referenceImagePlane.rowCosines
          .clone()
          .cross(referenceImagePlane.columnCosines);
        let angleInRadians = targetNormal.angleTo(referenceNormal);
        angleInRadians = Math.abs(angleInRadians);
        if (angleInRadians < 0.5) {
          console.warn(
            'Could not render reference lines, the angle between the two planes is lower than the required.'
          );
          return;
        }

        const points = planeIntersection(targetImagePlane, referenceImagePlane);

        if (!points) {
          console.warn(
            'Could not render reference lines, the plane intersection is undefined.'
          );
          return;
        }

        const referenceLine = {
          start: projectPatientPointToImagePlane(
            points.start,
            referenceImagePlane
          ),
          end: projectPatientPointToImagePlane(points.end, referenceImagePlane),
        };

        if (!referenceLine.start || !referenceLine.end) {
          console.warn(
            'Could not render reference lines, the initial or final coordinates are undefined.'
          );
          return;
        }

        const onReferenceElementImageRendered = () => {
          const context = getNewContext(referenceElement.canvas);
          context.setTransform(1, 0, 0, 1, 0, 0);
          draw(context, newContext => {
            drawLine(
              newContext,
              referenceElement.element,
              referenceLine.start,
              referenceLine.end,
              { color: 'greenyellow' }
            );
          });

          referenceElement.element.removeEventListener(
            cornerstone.EVENTS.IMAGE_RENDERED,
            onReferenceElementImageRendered
          );
        };

        referenceElement.element.addEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          onReferenceElementImageRendered
        );
        cornerstone.updateImage(referenceElement.element);
      });
  };

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    event => {
      event.detail.element.addEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        renderReferenceLines
      );
    }
  );

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    event => {
      event.detail.element.removeEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        renderReferenceLines
      );
    }
  );
};

export default enableReferenceLines;
