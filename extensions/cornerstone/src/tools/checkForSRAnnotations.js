import csTools from 'cornerstone-tools';
import cs from 'cornerstone-core';
import OHIF from '@ohif/core';

import { getEnabledElement } from '../state';
import id from './id';

const { studyMetadataManager } = OHIF.utils;

const checkForSRAnnotations = ({ viewportIndex, displaySet }) => {
  const srModule = csTools.getModule(id);

  const element = getEnabledElement(viewportIndex);
  if (!element) {
    return;
  }

  const { StudyInstanceUID } = displaySet;
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  if (!studyMetadata) {
    return;
  }

  const srDisplaySets = studyMetadata
    .getDisplaySets()
    .filter(ds => ds.Modality === 'SR');
  if (srDisplaySets.length === 0) {
    return;
  }

  const { measurements: _measurements } = srDisplaySets[0];
  if (!_measurements || _measurements.length < 1) {
    return;
  }

  const measurements = _measurements.filter(m => m.loaded === true);
  const measurement = measurements[0];
  if (!measurement) {
    return;
  }

  srModule.setters.trackingUniqueIdentifiersForElement(
    element,
    measurements.map(measurement => measurement.TrackingUniqueIdentifier),
    measurement
  );

  const { TrackingUniqueIdentifier } = measurement;
  srModule.setters.activeTrackingUniqueIdentifierForElement(
    element,
    TrackingUniqueIdentifier
  );

  cs.updateImage(element);
};

export default checkForSRAnnotations;
