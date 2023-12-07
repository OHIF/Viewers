import getLabelFromMeasuredValueSequence from './getLabelFromMeasuredValueSequence';
import getCoordsFromSCOORDOrSCOORD3D from './getCoordsFromSCOORDOrSCOORD3D';
import { RELATIONSHIP_TYPE, CodeNameCodeSequenceValues } from '../enums';

/**
 * TID 1410 Planar ROI Measurements and Qualitative Evaluations.
 *
 * @param {*} contentSequence
 * @returns
 */
const processTID1410Measurement = contentSequence => {
  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D

  const graphicItem = contentSequence.find(
    group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
  );

  if (!graphicItem) {
    console.warn(
      `graphic ValueType ${graphicItem.ValueType} not currently supported, skipping annotation.`
    );
    return;
  }

  const UIDREFContentItem = contentSequence.find(
    group => group.ValueType === 'UIDREF'
  );

  const TrackingIdentifierContentItem = contentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const NUMContentItems = contentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [getCoordsFromSCOORDOrSCOORD3D(graphicItem)],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  NUMContentItems.forEach(item => {
    const {
      ConceptNameCodeSequence,
      ContentSequence,
      MeasuredValueSequence,
    } = item;

    if (
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Score
    ) {
      ContentSequence.forEach(item => {
        if (
          [
            RELATIONSHIP_TYPE.SELECTED_FROM,
            RELATIONSHIP_TYPE.INFERRED_FROM,
          ].includes(item.RelationshipType)
        ) {
          if (item.ReferencedSOPSequence) {
            measurement.coords.forEach(coord => {
              coord.ReferencedSOPSequence = item.ReferencedSOPSequence;
            });
          }
        }
      });
    }

    if (MeasuredValueSequence) {
      measurement.labels.push(
        getLabelFromMeasuredValueSequence(
          ConceptNameCodeSequence,
          MeasuredValueSequence
        )
      );
    }
  });

  return measurement;
};

export default processTID1410Measurement;
