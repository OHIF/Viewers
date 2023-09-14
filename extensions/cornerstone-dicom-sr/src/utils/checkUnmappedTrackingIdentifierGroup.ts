import getClosestInstanceInfo, { getPointProjection } from './getClosestInstanceInfo';
import { utilities as csUtils } from '@cornerstonejs/core';

function toArray(x) {
  return Array.isArray(x) ? x : [x];
}

const TRACKING_IDENTIFIER = 'Tracking Identifier';

export default function checkUnmappedTrackingIdentifierGroup(
  measurementGroups,
  measurementGroup,
  displaySets
) {
  const measurementGroupContentSequence = toArray(measurementGroup.ContentSequence);
  const SCOORDContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'SCOORD'
  );
  const SCOORD3DContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'SCOORD3D'
  );
  const NUMContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'NUM'
  );
  if (!NUMContentItems.length) {
    if (SCOORDContentItems.length) {
      measurementGroupContentSequence[Object.keys(measurementGroupContentSequence).length] = {
        ContentSequence: SCOORDContentItems,
        ValueType: 'NUM',
      };
      return {
        cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
        toolName: 'PlanarFreehandROI',
      };
    } else if (SCOORD3DContentItems.length) {
      const measurementGroupMatrix = Object.assign({}, measurementGroup);
      const contentSequenceMatrix = [...measurementGroup.ContentSequence];
      const frameOfReference = SCOORD3DContentItems[0].ReferencedFrameOfReferenceUID;
      const closestInstanceInfos = getClosestInstanceInfo(
        SCOORD3DContentItems[0].GraphicData,
        frameOfReference,
        displaySets
      );

      for (let i = 0; i < closestInstanceInfos.length; i++) {
        const closestInstanceInfo = closestInstanceInfos[i];
        const SOPClassUID = closestInstanceInfo.instance.SOPClassUID;
        const SOPInstanceUID = closestInstanceInfo.instance.SOPInstanceUID;
        const point = getPointProjection(
          SCOORD3DContentItems[0].GraphicData,
          closestInstanceInfo.instance
        );
        const imagePoint = csUtils.worldToImageCoords(closestInstanceInfo.instance.imageId, point);

        const newSCOORDContentItem = {
          RelationshipType: 'CONTAINS',
          ValueType: 'SCOORD',
          ConceptNameCodeSequence: {
            CodeValue: '111030',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Image Region',
          },
          ContentSequence: {
            ReferencedSOPSequence: {
              ReferencedSOPClassUID: SOPClassUID,
              ReferencedSOPInstanceUID: SOPInstanceUID,
            },
            RelationshipType: 'SELECTED FROM',
            ValueType: 'IMAGE',
            ConceptNameCodeSequence: {
              CodeValue: '111040',
              CodingSchemeDesignator: 'DCM',
              CodeMeaning: 'Original Source',
            },
          },
          PixelOriginInterpretation: 'VOLUME',
          GraphicData: imagePoint,
          GraphicType: 'POINT',
        };
        if (i === 0) {
          measurementGroupContentSequence[Object.keys(measurementGroupContentSequence).length] = {
            ContentSequence: newSCOORDContentItem,
            ValueType: 'NUM',
          };
        } else {
          const measurementGroupClone = Object.assign({}, measurementGroupMatrix);
          measurementGroupClone.ContentSequence = [...contentSequenceMatrix];
          const contentSequence = toArray(measurementGroupClone.ContentSequence);
          contentSequence[Object.keys(contentSequence).length] = {
            ContentSequence: newSCOORDContentItem,
            ValueType: 'NUM',
          };

          // add TrackingIdentifier in the new measurement group
          const TrackingIdentifierGroup = contentSequence.find(
            contentItem => contentItem.ConceptNameCodeSequence.CodeMeaning === TRACKING_IDENTIFIER
          );
          const cornerstoneTag = 'Cornerstone3DTools@^0.1.0';
          const toolName = 'ArrowAnnotate';

          const mappedTrackingIdentifier = `${cornerstoneTag}:${toolName}`;
          TrackingIdentifierGroup.TextValue = mappedTrackingIdentifier;

          measurementGroups.push(measurementGroupClone);
        }
      }

      return {
        cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
        toolName: 'ArrowAnnotate',
      };
    }
  }
}
