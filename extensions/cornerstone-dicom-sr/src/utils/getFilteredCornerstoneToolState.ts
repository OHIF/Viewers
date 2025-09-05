import OHIF from '@ohif/core';
import { annotation } from '@cornerstonejs/tools';
import { NO_IMAGE_ID } from '@cornerstonejs/adapters';
const { log } = OHIF;


function getFilteredCornerstoneToolState(measurementData, additionalFindingTypes) {
  const filteredToolState = {};

  function addToFilteredToolState(annotation, toolType) {
    console.log('addToFilteredToolState annotation', annotation);
    console.log('addToFilteredToolState toolType', toolType);

    let imageId = annotation.metadata.referencedImageId;
    console.log('imageId', imageId);
    if (!annotation.metadata?.referencedImageId) {
      log.warn(`[DICOMSR] No referencedImageId found, switching to volumeId ${annotation.metadata.volumeId}`);
      imageId = NO_IMAGE_ID;
    }


    // const imageId = NO_IMAGE_ID;

    console.log('filteredToolState', filteredToolState);
    if (!filteredToolState[imageId]) {
      filteredToolState[imageId] = {};
    }

    const imageIdSpecificToolState = filteredToolState[imageId];
    console.log('imageIdSpecificToolState', imageIdSpecificToolState);

    console.log('measurementData in getFilteredCornerstoneToolState', annotation);
    const srToolType = toolType
    console.log('srToolType', srToolType);

    if (!imageIdSpecificToolState[srToolType]) {
      imageIdSpecificToolState[srToolType] = {
        data: [],
      };
    }

    const measurementDataI = measurementData.find(md => md.uid === annotation.annotationUID);
    const toolData = imageIdSpecificToolState[srToolType].data;
    console.log('toolData', toolData);

    let { finding } = measurementDataI;
    const findingSites = [];

    // NOTE -> We use the CORNERSTONEJS coding schemeDesignator which we have
    // defined in the @cornerstonejs/adapters
    if (measurementDataI.label) {
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
      findingSites.push(...measurementDataI.findingSites);
    }
    const measurement = Object.assign({}, annotation, {
      finding,
      findingSites,
    });
    console.log("toolData push measurement", measurement)
    toolData.push(measurement);
  }

  console.log('getFilteredCornerstoneToolState measurementData', measurementData);
  const uidFilter = measurementData.map(md => md.uid);
  const uids = uidFilter.slice();
  console.log('uids', uids);


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
          console.log('uidIndex', uidIndex);
          if (uidIndex !== -1) {
            addToFilteredToolState(annotation, toolType);
            uids.splice(uidIndex, 1);

            if (!uids.length) {
              console.log('filteredToolState getFilteredCornerstoneToolState', filteredToolState);
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
