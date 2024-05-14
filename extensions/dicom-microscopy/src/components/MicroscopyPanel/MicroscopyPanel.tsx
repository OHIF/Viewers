import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ExtensionManager, CommandsManager, DicomMetadataStore } from '@ohif/core';
import { MeasurementTable } from '@ohif/ui';
import { withTranslation, WithTranslation } from 'react-i18next';
import { EVENTS as MicroscopyEvents } from '../../services/MicroscopyService';
import dcmjs from 'dcmjs';
import callInputDialog from '../../utils/callInputDialog';
import constructSR from '../../utils/constructSR';
import { saveByteArray } from '../../utils/saveByteArray';

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

interface IMicroscopyPanelProps extends WithTranslation {
  viewports: PropTypes.array;
  activeViewportId: PropTypes.string;

  //
  onSaveComplete?: PropTypes.func; // callback when successfully saved annotations
  onRejectComplete?: PropTypes.func; // callback when rejected annotations

  //
  servicesManager: AppTypes.ServicesManager;
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

  const [studyInstanceUID, setStudyInstanceUID] = useState(null as string | null);
  const [roiAnnotations, setRoiAnnotations] = useState([] as any[]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null as any);
  const { servicesManager, extensionManager } = props;

  const { uiDialogService, displaySetService } = servicesManager.services;

  useEffect(() => {
    const viewport = props.viewports.get(props.activeViewportId);
    if (viewport?.displaySetInstanceUIDs[0]) {
      const displaySet = displaySetService.getDisplaySetByUID(viewport.displaySetInstanceUIDs[0]);
      if (displaySet) {
        setStudyInstanceUID(displaySet.StudyInstanceUID);
      }
    }
  }, [props.viewports, props.activeViewportId]);

  useEffect(() => {
    const onAnnotationUpdated = () => {
      const roiAnnotations = microscopyService.getAnnotationsForStudy(studyInstanceUID);
      setRoiAnnotations(roiAnnotations);
    };

    const onAnnotationSelected = () => {
      const selectedAnnotation = microscopyService.getSelectedAnnotation();
      setSelectedAnnotation(selectedAnnotation);
    };

    const onAnnotationRemoved = () => {
      onAnnotationUpdated();
    };

    const { unsubscribe: unsubscribeAnnotationUpdated } = microscopyService.subscribe(
      MicroscopyEvents.ANNOTATION_UPDATED,
      onAnnotationUpdated
    );
    const { unsubscribe: unsubscribeAnnotationSelected } = microscopyService.subscribe(
      MicroscopyEvents.ANNOTATION_SELECTED,
      onAnnotationSelected
    );
    const { unsubscribe: unsubscribeAnnotationRemoved } = microscopyService.subscribe(
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
    const annotations = microscopyService.getAnnotationsForStudy(studyInstanceUID);

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
      const displaySets = displaySetService.getDisplaySetsForSeries(series.SeriesInstanceUID);
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
    const annotations = microscopyService.getAnnotationsForStudy(studyInstanceUID);

    saving = true;

    // There is only one viewer possible for one study,
    // Since once study contains multiple resolution levels (series) of one whole
    // Slide image.

    const studyMetadata = DicomMetadataStore.getStudy(studyInstanceUID);
    const displaySets = getAllDisplaySets(studyMetadata);
    const smDisplaySet = displaySets.find(ds => ds.Modality === 'SM');

    // Get the next available series number after 4700.

    const dsWithMetadata = displaySets.filter(
      ds => ds.metadata && ds.metadata.SeriesNumber && typeof ds.metadata.SeriesNumber === 'number'
    );

    // Generate next series number
    const seriesNumbers = dsWithMetadata.map(ds => ds.metadata.SeriesNumber);
    const maxSeriesNumber = Math.max(...seriesNumbers, 4700);
    const SeriesNumber = maxSeriesNumber + 1;

    const { instance: metadata } = smDisplaySet;

    // construct SR dataset
    const dataset = constructSR(metadata, { SeriesDescription, SeriesNumber }, annotations);

    // Save in DICOM format
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
          message: 'Measurements downloaded successfully',
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
      const activeViewport = props.viewports[props.activeViewportId];
      const { StudyInstanceUID } = activeViewport;

      // TODO: studies?
      const study = DicomMetadataStore.getStudy(StudyInstanceUID);

      const lastDerivedDisplaySet = study.derivedDisplaySets.sort((ds1: any, ds2: any) => {
        const dateTime1 = Number(`${ds1.SeriesDate}${ds1.SeriesTime}`);
        const dateTime2 = Number(`${ds2.SeriesDate}${ds2.SeriesTime}`);
        return dateTime1 > dateTime2;
      })[study.derivedDisplaySets.length - 1];

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
    microscopyService.focusAnnotation(roiAnnotation, props.activeViewportId);
  };

  /**
   * Handler for "Edit" action of an annotation item
   * @param param0
   */
  const onMeasurementItemEditHandler = ({ uid, isActive }: { uid: string; isActive: boolean }) => {
    props.commandsManager.runCommand('setLabel', { uid }, 'MICROSCOPY');
  };

  const onMeasurementDeleteHandler = ({ uid, isActive }: { uid: string; isActive: boolean }) => {
    const roiAnnotation = microscopyService.getAnnotation(uid);
    microscopyService.removeAnnotation(roiAnnotation);
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
          ? `${formatLength(length, 'μm')} x ${formatLength(shortAxisLength, 'μm')}`
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

  return (
    <>
      <div
        className="ohif-scrollbar overflow-y-auto overflow-x-hidden"
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title="Measurements"
          servicesManager={props.servicesManager}
          data={data}
          onClick={onMeasurementItemClickHandler}
          onEdit={onMeasurementItemEditHandler}
          onDelete={onMeasurementDeleteHandler}
        />
      </div>
    </>
  );
}

const connectedMicroscopyPanel = withTranslation(['MicroscopyTable', 'Common'])(MicroscopyPanel);

export default connectedMicroscopyPanel;
