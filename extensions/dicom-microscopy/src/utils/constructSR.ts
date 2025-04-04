import dcmjs from 'dcmjs';
import DEVICE_OBSERVER_UID from './DEVICE_OBSERVER_UID';

/**
 *
 * @param {*} metadata - Microscopy Image instance metadata
 * @param {*} SeriesDescription - SR description
 * @param {*} annotations - Annotations
 *
 * @return Comprehensive3DSR dataset
 */
export default function constructSR(metadata, { SeriesDescription, SeriesNumber }, annotations) {
  // Handle malformed data
  if (!metadata.SpecimenDescriptionSequence) {
    metadata.SpecimenDescriptionSequence = {
      SpecimenUID: metadata.SeriesInstanceUID,
      SpecimenIdentifier: metadata.SeriesDescription,
    };
  }
  const { SpecimenDescriptionSequence } = metadata;

  // construct Comprehensive3DSR dataset
  const observationContext = new dcmjs.sr.templates.ObservationContext({
    observerPersonContext: new dcmjs.sr.templates.ObserverContext({
      observerType: new dcmjs.sr.coding.CodedConcept({
        value: '121006',
        schemeDesignator: 'DCM',
        meaning: 'Person',
      }),
      observerIdentifyingAttributes: new dcmjs.sr.templates.PersonObserverIdentifyingAttributes({
        name: '@ohif/extension-dicom-microscopy',
      }),
    }),
    observerDeviceContext: new dcmjs.sr.templates.ObserverContext({
      observerType: new dcmjs.sr.coding.CodedConcept({
        value: '121007',
        schemeDesignator: 'DCM',
        meaning: 'Device',
      }),
      observerIdentifyingAttributes: new dcmjs.sr.templates.DeviceObserverIdentifyingAttributes({
        uid: DEVICE_OBSERVER_UID,
      }),
    }),
    subjectContext: new dcmjs.sr.templates.SubjectContext({
      subjectClass: new dcmjs.sr.coding.CodedConcept({
        value: '121027',
        schemeDesignator: 'DCM',
        meaning: 'Specimen',
      }),
      subjectClassSpecificContext: new dcmjs.sr.templates.SubjectContextSpecimen({
        uid: SpecimenDescriptionSequence.SpecimenUID,
        identifier: SpecimenDescriptionSequence.SpecimenIdentifier || metadata.SeriesInstanceUID,
        containerIdentifier: metadata.ContainerIdentifier || metadata.SeriesInstanceUID,
      }),
    }),
  });

  const imagingMeasurements = [];
  for (let i = 0; i < annotations.length; i++) {
    const { roiGraphic: roi, label } = annotations[i];
    let { measurements, evaluations, marker, presentationState } = roi.properties;

    console.log('[SR] storing marker...', marker);
    console.log('[SR] storing measurements...', measurements);
    console.log('[SR] storing evaluations...', evaluations);
    console.log('[SR] storing presentation state...', presentationState);

    if (presentationState) {
      presentationState.marker = marker;
    }

    /** Avoid incompatibility with dcmjs */
    measurements = measurements.map((measurement: any) => {
      const ConceptName = Array.isArray(measurement.ConceptNameCodeSequence)
        ? measurement.ConceptNameCodeSequence[0]
        : measurement.ConceptNameCodeSequence;

      const MeasuredValue = Array.isArray(measurement.MeasuredValueSequence)
        ? measurement.MeasuredValueSequence[0]
        : measurement.MeasuredValueSequence;

      const MeasuredValueUnits = Array.isArray(MeasuredValue.MeasurementUnitsCodeSequence)
        ? MeasuredValue.MeasurementUnitsCodeSequence[0]
        : MeasuredValue.MeasurementUnitsCodeSequence;

      return new dcmjs.sr.valueTypes.NumContentItem({
        name: new dcmjs.sr.coding.CodedConcept({
          meaning: ConceptName.CodeMeaning,
          value: ConceptName.CodeValue,
          schemeDesignator: ConceptName.CodingSchemeDesignator,
        }),
        value: MeasuredValue.NumericValue,
        unit: new dcmjs.sr.coding.CodedConcept({
          value: MeasuredValueUnits.CodeValue,
          meaning: MeasuredValueUnits.CodeMeaning,
          schemeDesignator: MeasuredValueUnits.CodingSchemeDesignator,
        }),
      });
    });

    /** Avoid incompatibility with dcmjs */
    evaluations = evaluations.map((evaluation: any) => {
      const ConceptName = Array.isArray(evaluation.ConceptNameCodeSequence)
        ? evaluation.ConceptNameCodeSequence[0]
        : evaluation.ConceptNameCodeSequence;

      return new dcmjs.sr.valueTypes.TextContentItem({
        name: new dcmjs.sr.coding.CodedConcept({
          value: ConceptName.CodeValue,
          meaning: ConceptName.CodeMeaning,
          schemeDesignator: ConceptName.CodingSchemeDesignator,
        }),
        value: evaluation.TextValue,
        relationshipType: evaluation.RelationshipType,
      });
    });

    const identifier = `ROI #${i + 1}`;
    const group = new dcmjs.sr.templates.PlanarROIMeasurementsAndQualitativeEvaluations({
      trackingIdentifier: new dcmjs.sr.templates.TrackingIdentifier({
        uid: roi.uid,
        identifier: presentationState
          ? identifier.concat(`(${JSON.stringify(presentationState)})`)
          : identifier,
      }),
      referencedRegion: new dcmjs.sr.contentItems.ImageRegion3D({
        graphicType: roi.scoord3d.graphicType,
        graphicData: roi.scoord3d.graphicData,
        frameOfReferenceUID: roi.scoord3d.frameOfReferenceUID,
      }),
      findingType: new dcmjs.sr.coding.CodedConcept({
        value: label,
        schemeDesignator: '@ohif/extension-dicom-microscopy',
        meaning: 'FREETEXT',
      }),
      /** Evaluations will conflict with current tracking identifier */
      /** qualitativeEvaluations: evaluations, */
      measurements,
    });
    imagingMeasurements.push(...group);
  }

  const measurementReport = new dcmjs.sr.templates.MeasurementReport({
    languageOfContentItemAndDescendants: new dcmjs.sr.templates.LanguageOfContentItemAndDescendants(
      {}
    ),
    observationContext,
    procedureReported: new dcmjs.sr.coding.CodedConcept({
      value: '112703',
      schemeDesignator: 'DCM',
      meaning: 'Whole Slide Imaging',
    }),
    imagingMeasurements,
  });

  const dataset = new dcmjs.sr.documents.Comprehensive3DSR({
    content: measurementReport[0],
    evidence: [metadata],
    seriesInstanceUID: dcmjs.data.DicomMetaDictionary.uid(),
    seriesNumber: SeriesNumber,
    seriesDescription: SeriesDescription || 'Whole slide imaging structured report',
    sopInstanceUID: dcmjs.data.DicomMetaDictionary.uid(),
    instanceNumber: 1,
    manufacturer: 'dcmjs-org',
  });
  dataset.SpecificCharacterSet = 'ISO_IR 192';
  const fileMetaInformationVersionArray = new Uint8Array(2);
  fileMetaInformationVersionArray[1] = 1;

  dataset._meta = {
    FileMetaInformationVersion: {
      Value: [fileMetaInformationVersionArray.buffer], // TODO
      vr: 'OB',
    },
    MediaStorageSOPClassUID: dataset.sopClassUID,
    MediaStorageSOPInstanceUID: dataset.sopInstanceUID,
    TransferSyntaxUID: {
      Value: ['1.2.840.10008.1.2.1'],
      vr: 'UI',
    },
    ImplementationClassUID: {
      Value: [dcmjs.data.DicomMetaDictionary.uid()],
      vr: 'UI',
    },
    ImplementationVersionName: {
      Value: ['@ohif/extension-dicom-microscopy'],
      vr: 'SH',
    },
  };

  return dataset;
}
