import getClosestInstanceInfo, { getPointProjection } from "./getClosestInstanceInfo";
import { utilities as csUtils } from '@cornerstonejs/core';

export default function checkUnmappedTrackingIdentifierGroup(measurementGroupContentSequence, displaySets) {
    const SCOORDContentItems = measurementGroupContentSequence.filter(group => group.ValueType === 'SCOORD');
    const SCOORD3DContentItems = measurementGroupContentSequence.filter(group => group.ValueType === 'SCOORD3D');
    const NUMContentItems = measurementGroupContentSequence.filter(group => group.ValueType === 'NUM');
    if (!NUMContentItems.length) {
      if (SCOORDContentItems.length) {
        measurementGroupContentSequence[Object.keys(measurementGroupContentSequence).length] = {
          ['ContentSequence'] : SCOORDContentItems,
          ['ValueType'] : 'NUM'
        }
        return {
          cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
          toolName: 'PlanarFreehandROI',
        }
      } else if (SCOORD3DContentItems.length) {
        const frameOfReference = SCOORD3DContentItems[0].ReferencedFrameOfReferenceUID;
        const closestInstanceInfo = getClosestInstanceInfo(
          SCOORD3DContentItems[0].GraphicData,
          frameOfReference,
          displaySets
        );

        const SOPClassUID = closestInstanceInfo.instance.SOPClassUID;
        const SOPInstanceUID = closestInstanceInfo.instance.SOPInstanceUID;
        const point = getPointProjection(SCOORD3DContentItems[0].GraphicData, closestInstanceInfo.instance);
        const imagePoint = csUtils.worldToImageCoords(closestInstanceInfo.instance.imageId, point);

        const newSCOORDSContentItems = {
            "RelationshipType": "CONTAINS",
            "ValueType": "SCOORD",
            "ConceptNameCodeSequence": {
                    "CodeValue": "111030",
                    "CodingSchemeDesignator": "DCM",
                    "CodeMeaning": "Image Region"
            },
            "ContentSequence": {
                    "ReferencedSOPSequence": {
                            "ReferencedSOPClassUID": SOPClassUID,
                            "ReferencedSOPInstanceUID": SOPInstanceUID
                    },
                    "RelationshipType": "SELECTED FROM",
                    "ValueType": "IMAGE",
                    "ConceptNameCodeSequence":
                        {
                            "CodeValue": "111040",
                            "CodingSchemeDesignator": "DCM",
                            "CodeMeaning": "Original Source"
                        }

            },
            "PixelOriginInterpretation": "VOLUME",
            "GraphicData": imagePoint,
            "GraphicType": "POINT"
        }
        measurementGroupContentSequence[Object.keys(measurementGroupContentSequence).length] = {
          ['ContentSequence'] : newSCOORDSContentItems,
          ['ValueType'] : 'NUM'
        }
        return {
          cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
          toolName: 'ArrowAnnotate',
        }
      }

    }
}
