import getLabelFromMeasuredValueSequence from './getLabelFromMeasuredValueSequence';
import getCoordsFromSCOORDOrSCOORD3D from './getCoordsFromSCOORDOrSCOORD3D';
import { CodeNameCodeSequenceValues, CodingSchemeDesignators } from '../enums';

const CORNERSTONE_FREETEXT_CODE_VALUE = 'CORNERSTONEFREETEXT';

const processNonGeometricallyDefinedMeasurement = mergedContentSequence => {
  const NUMContentItems = mergedContentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  const UIDREFContentItem = mergedContentSequence.find(
    group => group.ValueType === 'UIDREF'
  );

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const Finding = mergedContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Finding
  );

  const FindingSites = mergedContentSequence.filter(
    item =>
      item.ConceptNameCodeSequence.CodingSchemeDesignator ===
        CodingSchemeDesignators.SRT &&
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.FindingSite
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  if (
    Finding &&
    Finding.ConceptCodeSequence.CodingSchemeDesignator ===
      CodingSchemeDesignators.cornerstoneTools4 &&
    Finding.ConceptCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.CornerstoneFreeText
  ) {
    measurement.labels.push({
      label: CORNERSTONE_FREETEXT_CODE_VALUE,
      value: Finding.ConceptCodeSequence.CodeMeaning,
    });
  }

  // TODO -> Eventually hopefully support SNOMED or some proper code library, just free text for now.
  if (FindingSites.length) {
    const cornerstoneFreeTextFindingSite = FindingSites.find(
      FindingSite =>
        FindingSite.ConceptCodeSequence.CodingSchemeDesignator ===
          CodingSchemeDesignators.cornerstoneTools4 &&
        FindingSite.ConceptCodeSequence.CodeValue ===
          CodeNameCodeSequenceValues.CornerstoneFreeText
    );

    if (cornerstoneFreeTextFindingSite) {
      measurement.labels.push({
        label: CORNERSTONE_FREETEXT_CODE_VALUE,
        value: cornerstoneFreeTextFindingSite.ConceptCodeSequence.CodeMeaning,
      });
    }
  }

  NUMContentItems.forEach(item => {
    const {
      ConceptNameCodeSequence,
      ContentSequence,
      MeasuredValueSequence,
    } = item;

    if (!ContentSequence) {
      console.warn(`Graphic ${ContentSequence} missing, skipping annotation.`);

      return;
    }

    const { ValueType } = ContentSequence;

    if (!ValueType === 'SCOORD' && !ValueType === 'SCOORD3D') {
      console.warn(
        `Graphic ${ValueType} not currently supported, skipping annotation.`
      );

      return;
    }

    const coords = getCoordsFromSCOORDOrSCOORD3D(ContentSequence);

    if (coords) {
      measurement.coords.push(coords);
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

export default processNonGeometricallyDefinedMeasurement;
