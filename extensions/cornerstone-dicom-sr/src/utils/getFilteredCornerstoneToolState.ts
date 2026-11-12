import { annotation } from '@cornerstonejs/tools';
import { NO_IMAGE_ID } from '@cornerstonejs/adapters';

/** SR display sub-types have no SR adapter of their own; export them as the base tool. */
const EXPORT_TOOL_TYPE = {
  SRPoint: 'Probe',
  SRRectangleROI: 'RectangleROI',
};

function getFilteredCornerstoneToolState(measurementData, additionalFindingTypes) {
  const filteredToolState = {};

  function addToFilteredToolState(annotation, toolType) {
    const imageId = annotation.metadata?.referencedImageId ?? NO_IMAGE_ID;

    if (!filteredToolState[imageId]) {
      filteredToolState[imageId] = {};
    }

    const imageIdSpecificToolState = filteredToolState[imageId];

    if (!imageIdSpecificToolState[toolType]) {
      imageIdSpecificToolState[toolType] = {
        data: [],
      };
    }

    const measurementDataI = measurementData.find(md => md.uid === annotation.annotationUID);
    const toolData = imageIdSpecificToolState[toolType].data;

    let { finding } = measurementDataI;
    const findingSites = [];

    // NOTE -> We use the CORNERSTONEJS coding schemeDesignator which we have
    // defined in the @cornerstonejs/adapters
    /**
     * A label equal to the coded Finding came from that Finding on hydration, so it is not written
     * again as free text.
     */
    const labelIsFinding =
      !!measurementDataI.label && measurementDataI.label === finding?.CodeMeaning;
    if (measurementDataI.label && !labelIsFinding) {
      if (additionalFindingTypes.includes(toolType)) {
        finding = {
          CodeValue: 'CORNERSTONEFREETEXT',
          CodingSchemeDesignator: 'CORNERSTONEJS',
          CodeMeaning: measurementDataI.label,
        };
      } else {
        findingSites.push({
          CodeValue: 'CORNERSTONEFREETEXT',
          CodingSchemeDesignator: 'CORNERSTONEJS',
          CodeMeaning: measurementDataI.label,
        });
      }
    }

    if (measurementDataI.findingSites) {
      /**
       * When the label is the Finding, an older free-text site would become the label on reimport
       * and hide the label, so it is not written.
       */
      findingSites.push(
        ...measurementDataI.findingSites.filter(
          site => !labelIsFinding || site?.CodeValue !== 'CORNERSTONEFREETEXT'
        )
      );
    }

    const measurement = Object.assign({}, annotation, {
      finding,
      findingSites,
    });

    toolData.push(measurement);
  }

  const uidFilter = measurementData.map(md => md.uid);
  const uids = uidFilter.slice();

  const annotationManager = annotation.state.getAnnotationManager();
  const framesOfReference = annotationManager.getFramesOfReference();

  for (let i = 0; i < framesOfReference.length; i++) {
    const frameOfReference = framesOfReference[i];

    const frameOfReferenceAnnotations = annotationManager.getAnnotations(frameOfReference);

    const toolTypes = Object.keys(frameOfReferenceAnnotations);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];

      const annotations = frameOfReferenceAnnotations[toolType];

      if (annotations) {
        for (let k = 0; k < annotations.length; k++) {
          const annotation = annotations[k];
          const uidIndex = uids.findIndex(uid => uid === annotation.annotationUID);

          if (uidIndex !== -1) {
            addToFilteredToolState(annotation, EXPORT_TOOL_TYPE[toolType] ?? toolType);
            uids.splice(uidIndex, 1);

            if (!uids.length) {
              return filteredToolState;
            }
          }
        }
      }
    }
  }

  return filteredToolState;
}

export default getFilteredCornerstoneToolState;
