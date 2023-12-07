import getLabelFromMeasuredValueSequence from './getLabelFromMeasuredValueSequence';
import getCoordsFromSCOORDOrSCOORD3D from './getCoordsFromSCOORDOrSCOORD3D';
import { CodeNameCodeSequenceValues, CodingSchemeDesignators } from '../enums';
import SCOORD_TYPES from '../constants/scoordTypes';

const CORNERSTONE_FREETEXT_CODE_VALUE = 'CORNERSTONEFREETEXT';

const processNonGeometricallyDefinedMeasurement = contentSequence => {
  const NUMContentItems = contentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  const CODEContentItems = contentSequence.filter(
    group => group.ValueType === 'CODE'
  );

  const UIDREFContentItem = contentSequence.find(
    group => group.ValueType === 'UIDREF'
  );

  const IMAGEContentItem = contentSequence.find(
    group => group.ValueType === 'IMAGE'
  );

  const TrackingIdentifierContentItem = contentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const Finding = contentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Finding
  );

  const FindingSites = contentSequence.filter(
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

  if (NUMContentItems.length === 0 && IMAGEContentItem) {
    CODEContentItems.forEach(item => {
      const { ConceptCodeSequence, ConceptNameCodeSequence } = item;

      if (!ConceptCodeSequence || !ConceptNameCodeSequence) {
        console.warn(`Graphic missing, skipping annotation.`);

        return;
      }

      const GraphicData = [0, 0];
      const GraphicType = SCOORD_TYPES.TEXT;
      const { ValueType } = item;
      const ReferencedSOPSequence = IMAGEContentItem.ReferencedSOPSequence;
      const coord = {
        ValueType,
        GraphicType,
        GraphicData,
        ReferencedSOPSequence,
      };
      measurement.coords.push(coord);
      measurement.labels.push({
        label: ConceptNameCodeSequence.CodeMeaning,
        labelCodingSchemeDesignator:
          ConceptNameCodeSequence.CodingSchemeDesignator,
        value: ConceptCodeSequence.CodeMeaning,
        valueCodingSchemeDesignator: ConceptCodeSequence.CodingSchemeDesignator,
      });
    });
  }

  return measurement;
};

export default processNonGeometricallyDefinedMeasurement;
