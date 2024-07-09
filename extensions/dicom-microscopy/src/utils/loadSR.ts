import dcmjs from 'dcmjs';

import DCM_CODE_VALUES from './dcmCodeValues';
import toArray from './toArray';

const MeasurementReport = dcmjs.adapters.DICOMMicroscopyViewer.MeasurementReport;

// Define as async so that it returns a promise, expected by the ViewportGrid
export default async function loadSR(
  microscopyService,
  microscopySRDisplaySet,
  referencedDisplaySet
) {
  const naturalizedDataset = microscopySRDisplaySet.metadata;

  const { StudyInstanceUID, FrameOfReferenceUID } = referencedDisplaySet;

  const managedViewers = microscopyService.getManagedViewersForStudy(StudyInstanceUID);

  if (!managedViewers || !managedViewers.length) {
    return;
  }

  microscopySRDisplaySet.isLoaded = true;

  const { rois, labels } = await _getROIsFromToolState(microscopyService, naturalizedDataset, FrameOfReferenceUID);

  const managedViewer = managedViewers[0];

  for (let i = 0; i < rois.length; i++) {
    // NOTE: When saving Microscopy SR, we are attaching identifier property
    // to each ROI, and when read for display, it is coming in as "TEXT"
    // evaluation.
    // As the Dicom Microscopy Viewer will override styles for "Text" evaluations
    // to hide all other geometries, we are going to manually remove that
    // evaluation item.
    const roi = rois[i];
    const roiSymbols = Object.getOwnPropertySymbols(roi);
    const _properties = roiSymbols.find(s => s.description === 'properties');
    const properties = roi[_properties];
    properties['evaluations'] = [];

    managedViewer.addRoiGraphicWithLabel(roi, labels[i]);
  }
}

async function _getROIsFromToolState(microscopyService, naturalizedDataset, FrameOfReferenceUID) {
  const toolState = MeasurementReport.generateToolState(naturalizedDataset);
  const tools = Object.getOwnPropertyNames(toolState);
  // Does a dynamic import to prevent webpack from rebuilding the library
  const DICOMMicroscopyViewer = await microscopyService.importDicomMicroscopyViewer();

  const measurementGroupContentItems = _getMeasurementGroups(naturalizedDataset);

  const rois = [];
  const labels = [];

  tools.forEach(t => {
    const toolSpecificToolState = toolState[t];
    let scoord3d;

    const capsToolType = t.toUpperCase();

    const measurementGroupContentItemsForTool = measurementGroupContentItems.filter(mg => {
      const imageRegionContentItem = toArray(mg.ContentSequence).find(
        ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.IMAGE_REGION
      );

      return imageRegionContentItem.GraphicType === capsToolType;
    });

    toolSpecificToolState.forEach((coordinates, index) => {
      const properties = {};

      const options = {
        coordinates,
        frameOfReferenceUID: FrameOfReferenceUID,
      };

      if (t === 'Polygon') {
        scoord3d = new DICOMMicroscopyViewer.scoord3d.Polygon(options);
      } else if (t === 'Polyline') {
        scoord3d = new DICOMMicroscopyViewer.scoord3d.Polyline(options);
      } else if (t === 'Point') {
        scoord3d = new DICOMMicroscopyViewer.scoord3d.Point(options);
      } else if (t === 'Ellipse') {
        scoord3d = new DICOMMicroscopyViewer.scoord3d.Ellipse(options);
      } else {
        throw new Error('Unsupported tool type');
      }

      const measurementGroup = measurementGroupContentItemsForTool[index];
      const findingGroup = toArray(measurementGroup.ContentSequence).find(
        ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.FINDING
      );

      const trackingGroup = toArray(measurementGroup.ContentSequence).find(
        ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.TRACKING_UNIQUE_IDENTIFIER
      );

      /**
       * Extract presentation state from tracking identifier.
       * Currently is stored in SR but should be stored in its tags.
       */
      if (trackingGroup) {
        const regExp = /\(([^)]+)\)/;
        const matches = regExp.exec(trackingGroup.TextValue);
        if (matches && matches[1]) {
          properties.presentationState = JSON.parse(matches[1]);
          properties.marker = properties.presentationState.marker;
        }
      }

      let measurements = toArray(measurementGroup.ContentSequence).filter(ci =>
        [
          DCM_CODE_VALUES.LENGTH,
          DCM_CODE_VALUES.AREA,
          DCM_CODE_VALUES.SHORT_AXIS,
          DCM_CODE_VALUES.LONG_AXIS,
          DCM_CODE_VALUES.ELLIPSE_AREA,
        ].includes(ci.ConceptNameCodeSequence.CodeValue)
      );

      let evaluations = toArray(measurementGroup.ContentSequence).filter(ci =>
        [DCM_CODE_VALUES.TRACKING_UNIQUE_IDENTIFIER].includes(ci.ConceptNameCodeSequence.CodeValue)
      );

      /**
       * TODO: Resolve bug in DCMJS.
       * ConceptNameCodeSequence should be a sequence with only one item.
       */
      evaluations = evaluations.map(evaluation => {
        const e = { ...evaluation };
        e.ConceptNameCodeSequence = toArray(e.ConceptNameCodeSequence);
        return e;
      });

      /**
       * TODO: Resolve bug in DCMJS.
       * ConceptNameCodeSequence should be a sequence with only one item.
       */
      measurements = measurements.map(measurement => {
        const m = { ...measurement };
        m.ConceptNameCodeSequence = toArray(m.ConceptNameCodeSequence);
        return m;
      });

      if (measurements && measurements.length) {
        properties.measurements = measurements;
        console.log('[SR] retrieving measurements...', measurements);
      }

      if (evaluations && evaluations.length) {
        properties.evaluations = evaluations;
        console.log('[SR] retrieving evaluations...', evaluations);
      }

      const roi = new DICOMMicroscopyViewer.roi.ROI({ scoord3d, properties });
      rois.push(roi);

      if (findingGroup) {
        labels.push(findingGroup.ConceptCodeSequence.CodeValue);
      } else {
        labels.push('');
      }
    });
  });

  return { rois, labels };
}

function _getMeasurementGroups(naturalizedDataset) {
  const { ContentSequence } = naturalizedDataset;

  const imagingMeasurementsContentItem = ContentSequence.find(
    ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.IMAGING_MEASUREMENTS
  );

  const measurementGroupContentItems = toArray(
    imagingMeasurementsContentItem.ContentSequence
  ).filter(ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.MEASUREMENT_GROUP);

  return measurementGroupContentItems;
}
