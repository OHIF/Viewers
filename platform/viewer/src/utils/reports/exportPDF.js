import { utils } from '@ohif/core';
import csTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import MeasurementReport from './MeasurementReport';
import { formatPatientName, getLocationLabel } from './helpers';
const { studyMetadataManager } = utils;

const exportPdf = (measurementApi, timepointApi) => {
  const currentTimepoint = timepointApi.current();
  const { timepointId, studyInstanceUids } = currentTimepoint;

  const study = studyMetadataManager.get(studyInstanceUids[0]).getData();

  const report = new MeasurementReport({
    header: {
      trial: 'RECIST 1.1',
      patientName: formatPatientName(study.patientName),
      mrn: study.patientId,
      timepoint: timepointApi.name(currentTimepoint),
    },
  });

  const $element = document.createElement('div');
  $element.style.height = '800px';
  $element.style.left = 0;
  $element.style.position = 'fixed';
  $element.style.top = 0;
  $element.style.visibility = 'hidden';
  $element.style.width = '800px';
  $element.style.zIndex = -1;

  const element = $element;
  document.body.appendChild($element);

  cornerstone.enable(element, { renderer: 'webgl' });
  const enabledElement = cornerstone.getEnabledElement(element);
  enabledElement.toolStateManager = csTools.newImageIdSpecificToolStateManager();

  /* measurementApi.fetch('targets', { timepointId });
     measurementApi.fetch('nonTargets', { timepointId });
     targets.concat(nonTargets); */
  const measurements = measurementApi.fetch(
    'allTools',
    tool => tool.timepointId === timepointId
  );

  const iterator = measurements[Symbol.iterator]();
  const printMeasurements = callback => {
    const current = iterator.next();

    if (current.done) {
      callback();
      return;
    }

    const measurement = current.value;
    cornerstone.loadImage(measurement.imageId).then(image => {
      const toolName = `${measurement.toolType}Tool`;

      cornerstone.displayImage(element, image);
      csTools.addToolState(element, measurement.toolType, measurement);
      csTools.setToolEnabledForElement(element, measurement.toolType); // csTools[measurement.toolType].enable(element);

      const series = cornerstone.metaData.get('series', measurement.imageId);
      const instance = cornerstone.metaData.get('instance', measurement.imageId);

      let info = measurement.response;
      if (!info) {
        info = measurement.longestDiameter;
        if (measurement.shortestDiameter) {
          info += ` × ${measurement.shortestDiameter}`;
        }

        info += ' mm';
      }

      if (series && instance) {
        info += ` (S:${series.seriesNumber}, I:${instance.instanceNumber})`;
      }

      let type = measurementApi.toolsGroupsMap[toolName];
      type = type === 'targets' ? 'Target' : type === 'nonTargets' ? 'Non-target' : 'All Targets';

      report.printMeasurement({
        type,
        number: measurement.measurementNumber,
        location: getLocationLabel(measurement),
        info,
        image: enabledElement.canvas.toDataURL('image/jpeg', 0.85),
      });

      csTools.clearToolState(element, toolName);

      printMeasurements(callback);
    });
  };

  printMeasurements(() => {
    $element.remove();
    report.save('measurements.pdf');
  });
};

export default exportPdf;
