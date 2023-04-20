import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ServicesManager,
  ExtensionManager,
  CommandsManager,
  DicomMetadataStore,
} from '@ohif/core';
import { MeasurementTable, Icon, ButtonGroup, Button } from '@ohif/ui';
import { withTranslation, WithTranslation } from 'react-i18next';
import DEVICE_OBSERVER_UID from '../../utils/DEVICE_OBSERVER_UID';
import { EVENTS as MicroscopyEvents } from '../../services/MicroscopyService';
import dcmjs from 'dcmjs';
import styles from '../../utils/styles';
import callInputDialog from '../../utils/callInputDialog';

let saving = false;
const { datasetToBuffer } = dcmjs.data;

const formatArea = area => {
  let mult = 1;
  let unit = 'mm';
  if (area > 1000000) {
    unit = 'm';
    mult = 1 / 1000000;
  } else if (area < 1) {
    unit = 'μm';
    mult = 1000000;
  }
  return `${(area * mult).toFixed(2)} ${unit}²`;
};

const formatLength = (length, unit) => {
  let mult = 1;
  if (unit == 'km' || (!unit && length > 1000000)) {
    unit = 'km';
    mult = 1 / 1000000;
  } else if (unit == 'm' || (!unit && length > 1000)) {
    unit = 'm';
    mult = 1 / 1000;
  } else if (unit == 'μm' || (!unit && length < 1)) {
    unit = 'μm';
    mult = 1000;
  } else if (unit && unit != 'mm') {
    throw new Error(`Unknown length unit ${unit}`);
  } else {
    unit = 'mm';
  }
  return `${(length * mult).toFixed(2)} ${unit}`;
};

/**
 * Trigger file download from an array buffer
 * @param buffer
 * @param filename
 */
function saveByteArray(buffer: ArrayBuffer, filename: string) {
  var blob = new Blob([buffer], { type: 'application/dicom' });
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

interface IMicroscopyPanelProps extends WithTranslation {
  viewports: PropTypes.array;
  activeViewportIndex: PropTypes.number;

  //
  onSaveComplete?: PropTypes.func; // callback when successfully saved annotations
  onRejectComplete?: PropTypes.func; // callback when rejected annotations

  //
  servicesManager: ServicesManager;
  extensionManager: ExtensionManager;
  commandsManager: CommandsManager;
}

/**
 * Microscopy Measurements Panel Component
 *
 * @param props
 * @returns
 */
function MicroscopyPanel(props: IMicroscopyPanelProps) {
  const { microscopyService } = props.servicesManager.services;

  const [studyInstanceUID, setStudyInstanceUID] = useState(
    null as string | null
  );
  const [roiAnnotations, setRoiAnnotations] = useState([] as any[]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null as any);
  const { servicesManager, extensionManager } = props;

  const { uiDialogService, displaySetService } = servicesManager.services;

  useEffect(() => {
    const viewport = props.viewports[props.activeViewportIndex];
    if (viewport.displaySetInstanceUIDs[0]) {
      const displaySet = displaySetService.getDisplaySetByUID(
        viewport.displaySetInstanceUIDs[0]
      );
      if (displaySet) {
        setStudyInstanceUID(displaySet.StudyInstanceUID);
      }
    }
  }, [props.viewports, props.activeViewportIndex]);

  useEffect(() => {
    const onAnnotationUpdated = () => {
      const roiAnnotations = microscopyService.getAnnotationsForStudy(
        studyInstanceUID
      );
      setRoiAnnotations(roiAnnotations);
    };

    const onAnnotationSelected = () => {
      const selectedAnnotation = microscopyService.getSelectedAnnotation();
      setSelectedAnnotation(selectedAnnotation);
    };

    const onAnnotationRemoved = () => {
      onAnnotationUpdated();
    };

    const {
      unsubscribe: unsubscribeAnnotationUpdated,
    } = microscopyService.subscribe(
      MicroscopyEvents.ANNOTATION_UPDATED,
      onAnnotationUpdated
    );
    const {
      unsubscribe: unsubscribeAnnotationSelected,
    } = microscopyService.subscribe(
      MicroscopyEvents.ANNOTATION_SELECTED,
      onAnnotationSelected
    );
    const {
      unsubscribe: unsubscribeAnnotationRemoved,
    } = microscopyService.subscribe(
      MicroscopyEvents.ANNOTATION_REMOVED,
      onAnnotationRemoved
    );
    onAnnotationUpdated();
    onAnnotationSelected();

    // on unload unsubscribe from events
    return () => {
      unsubscribeAnnotationUpdated();
      unsubscribeAnnotationSelected();
      unsubscribeAnnotationRemoved();
    };
  }, [studyInstanceUID]);

  /**
   * On clicking "Save Annotations" button, prompt an input modal for the
   * new series' description, and continue to save.
   *
   * @returns
   */
  const promptSave = () => {
    const annotations = microscopyService.getAnnotationsForStudy(
      studyInstanceUID
    );

    if (!annotations || saving) {
      return;
    }

    callInputDialog({
      uiDialogService,
      title: 'Enter description of the Series',
      defaultValue: '',
      callback: (value: string, action: string) => {
        switch (action) {
          case 'save': {
            saveFunction(value);
          }
        }
      },
    });
  };

  const getAllDisplaySets = (studyMetadata: any) => {
    let allDisplaySets = [] as any[];
    studyMetadata.series.forEach((series: any) => {
      const displaySets = displaySetService.getDisplaySetsForSeries(
        series.SeriesInstanceUID
      );
      allDisplaySets = allDisplaySets.concat(displaySets);
    });
    return allDisplaySets;
  };

  /**
   * Save annotations as a series
   *
   * @param SeriesDescription - series description
   * @returns
   */
  const saveFunction = async (SeriesDescription: string) => {
    const dataSource = extensionManager.getActiveDataSource()[0];
    const { onSaveComplete } = props;
    const imagingMeasurements = [];
    const annotations = microscopyService.getAnnotationsForStudy(
      studyInstanceUID
    );

    saving = true;

    // There is only one viewer possible for one study,
    // Since once study contains multiple resolution levels (series) of one whole
    // Slide image.

    const studyMetadata = DicomMetadataStore.getStudy(studyInstanceUID);
    const displaySets = getAllDisplaySets(studyMetadata);
    const smDisplaySet = displaySets.find(ds => ds.Modality === 'SM');

    // Get the next available series number after 4700.

    const dsWithMetadata = displaySets.filter(
      ds =>
        ds.metadata &&
        ds.metadata.SeriesNumber &&
        typeof ds.metadata.SeriesNumber === 'number'
    );

    const seriesNumbers = dsWithMetadata.map(ds => ds.metadata.SeriesNumber);
    const maxSeriesNumber = Math.max(...seriesNumbers, 4700);
    const SeriesNumber = maxSeriesNumber + 1;

    const { instance: metadata } = smDisplaySet;

    // Handle malformed data
    if (!metadata.SpecimenDescriptionSequence) {
      metadata.SpecimenDescriptionSequence = {
        SpecimenUID: metadata.SeriesInstanceUID,
        SpecimenIdentifier: metadata.SeriesDescription,
      };
    }
    const { SpecimenDescriptionSequence } = metadata;

    const observationContext = new dcmjs.sr.templates.ObservationContext({
      observerPersonContext: new dcmjs.sr.templates.ObserverContext({
        observerType: new dcmjs.sr.coding.CodedConcept({
          value: '121006',
          schemeDesignator: 'DCM',
          meaning: 'Person',
        }),
        observerIdentifyingAttributes: new dcmjs.sr.templates.PersonObserverIdentifyingAttributes(
          {
            name: '@ohif/extension-dicom-microscopy',
          }
        ),
      }),
      observerDeviceContext: new dcmjs.sr.templates.ObserverContext({
        observerType: new dcmjs.sr.coding.CodedConcept({
          value: '121007',
          schemeDesignator: 'DCM',
          meaning: 'Device',
        }),
        observerIdentifyingAttributes: new dcmjs.sr.templates.DeviceObserverIdentifyingAttributes(
          {
            uid: DEVICE_OBSERVER_UID,
          }
        ),
      }),
      subjectContext: new dcmjs.sr.templates.SubjectContext({
        subjectClass: new dcmjs.sr.coding.CodedConcept({
          value: '121027',
          schemeDesignator: 'DCM',
          meaning: 'Specimen',
        }),
        subjectClassSpecificContext: new dcmjs.sr.templates.SubjectContextSpecimen(
          {
            uid: SpecimenDescriptionSequence.SpecimenUID,
            identifier:
              SpecimenDescriptionSequence.SpecimenIdentifier ||
              metadata.SeriesInstanceUID,
            containerIdentifier:
              metadata.ContainerIdentifier || metadata.SeriesInstanceUID,
          }
        ),
      }),
    });

    for (let i = 0; i < annotations.length; i++) {
      const { roiGraphic: roi, label } = annotations[i];
      let {
        measurements,
        evaluations,
        marker,
        presentationState,
      } = roi.properties;

      console.debug('[SR] storing marker...', marker);
      console.debug('[SR] storing measurements...', measurements);
      console.debug('[SR] storing evaluations...', evaluations);
      console.debug('[SR] storing presentation state...', presentationState);

      if (presentationState) presentationState.marker = marker;

      /** Avoid incompatibility with dcmjs */
      measurements = measurements.map((measurement: any) => {
        const ConceptName = Array.isArray(measurement.ConceptNameCodeSequence)
          ? measurement.ConceptNameCodeSequence[0]
          : measurement.ConceptNameCodeSequence;

        const MeasuredValue = Array.isArray(measurement.MeasuredValueSequence)
          ? measurement.MeasuredValueSequence[0]
          : measurement.MeasuredValueSequence;

        const MeasuredValueUnits = Array.isArray(
          MeasuredValue.MeasurementUnitsCodeSequence
        )
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
      const group = new dcmjs.sr.templates.PlanarROIMeasurementsAndQualitativeEvaluations(
        {
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
        }
      );
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
      seriesDescription:
        SeriesDescription || 'Whole slide imaging structured report',
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

    try {
      if (dataSource) {
        if (dataSource.wadoRoot == 'saveDicom') {
          // download as DICOM file
          const part10Buffer = datasetToBuffer(dataset);
          saveByteArray(part10Buffer, `sr-microscopy.dcm`);
        } else {
          // Save into Web Data source
          const { StudyInstanceUID } = dataset;
          await dataSource.store.dicom(dataset);
          if (StudyInstanceUID) {
            dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
          }
        }
        onSaveComplete({
          title: 'SR Saved',
          meassage: 'Measurements downloaded successfully',
          type: 'success',
        });
      } else {
        console.error('Server unspecified');
      }
    } catch (error) {
      onSaveComplete({
        title: 'SR Save Failed',
        message: error.message || error.toString(),
        type: 'error',
      });
    } finally {
      saving = false;
    }
  };

  /**
   * On clicking "Reject annotations" button
   */
  const onDeleteCurrentSRHandler = async () => {
    try {
      const activeViewport = props.viewports[props.activeViewportIndex];
      const { StudyInstanceUID } = activeViewport;

      // TODO: studies?
      const study = DicomMetadataStore.getStudy(StudyInstanceUID);

      const lastDerivedDisplaySet = study.derivedDisplaySets.sort(
        (ds1: any, ds2: any) => {
          const dateTime1 = Number(`${ds1.SeriesDate}${ds1.SeriesTime}`);
          const dateTime2 = Number(`${ds2.SeriesDate}${ds2.SeriesTime}`);
          return dateTime1 > dateTime2;
        }
      )[study.derivedDisplaySets.length - 1];

      // TODO: use dataSource.reject.dicom()
      // await DICOMSR.rejectMeasurements(
      //   study.wadoRoot,
      //   lastDerivedDisplaySet.StudyInstanceUID,
      //   lastDerivedDisplaySet.SeriesInstanceUID
      // );
      props.onRejectComplete({
        title: 'Report rejected',
        message: 'Latest report rejected successfully',
        type: 'success',
      });
    } catch (error) {
      props.onRejectComplete({
        title: 'Failed to reject report',
        message: error.message,
        type: 'error',
      });
    }
  };

  /**
   * Handler for clicking event of an annotation item.
   *
   * @param param0
   */
  const onMeasurementItemClickHandler = ({ uid }: { uid: string }) => {
    const roiAnnotation = microscopyService.getAnnotation(uid);
    microscopyService.selectAnnotation(roiAnnotation);
    microscopyService.focusAnnotation(roiAnnotation, props.activeViewportIndex);
  };

  /**
   * Handler for "Edit" action of an annotation item
   * @param param0
   */
  const onMeasurementItemEditHandler = ({
    uid,
    isActive,
  }: {
    uid: string;
    isActive: boolean;
  }) => {
    props.commandsManager.runCommand('setLabel', { uid }, 'MICROSCOPY');
  };

  // Convert ROI annotations managed by microscopyService into our
  // own format for display
  const data = roiAnnotations.map((roiAnnotation, index) => {
    const label = roiAnnotation.getDetailedLabel();
    const area = roiAnnotation.getArea();
    const length = roiAnnotation.getLength();
    const shortAxisLength = roiAnnotation.roiGraphic.properties.shortAxisLength;
    const isSelected: boolean = selectedAnnotation === roiAnnotation;

    // other events
    const { uid } = roiAnnotation;

    // display text
    const displayText = [];

    if (area !== undefined) {
      displayText.push(formatArea(area));
    } else if (length !== undefined) {
      displayText.push(
        shortAxisLength
          ? `${formatLength(length, 'μm')} x ${formatLength(
              shortAxisLength,
              'μm'
            )}`
          : `${formatLength(length, 'μm')}`
      );
    }

    // convert to measurementItem format compatible with <MeasurementTable /> component
    return {
      uid,
      index,
      label,
      isActive: isSelected,
      displayText,
      roiAnnotation,
    };
  });

  const disabled = data.length === 0;

  return (
    <>
      <div
        className="overflow-x-hidden overflow-y-auto ohif-scrollbar"
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title="Measurements"
          servicesManager={props.servicesManager}
          data={data}
          onClick={onMeasurementItemClickHandler}
          onEdit={onMeasurementItemEditHandler}
        />
      </div>
      <div className="flex justify-center p-4">
        <ButtonGroup color="black" size="inherit">
          {promptSave && (
            <Button
              className="px-2 py-2 text-base"
              size="initial"
              variant={disabled ? 'disabled' : 'outlined'}
              color="black"
              border="primaryActive"
              onClick={promptSave}
            >
              {props.t('Create Report')}
            </Button>
          )}
          {/* <Button
            className="px-2 py-2 text-base"
            onClick={onDeleteCurrentSRHandler}
          >
            {props.t('Reject latest report')}
          </Button> */}
        </ButtonGroup>
      </div>
    </>
  );
}

const connectedMicroscopyPanel = withTranslation(['MicroscopyTable', 'Common'])(
  MicroscopyPanel
);

export default connectedMicroscopyPanel;
