import { OHIF } from 'meteor/ohif:core';
import { MeasurementReport } from 'meteor/ohif:measurements/client/reports/measurement';
import { $ } from 'meteor/jquery';

OHIF.measurements.exportPdf = (measurementApi, timepointApi) => {
    const currentTimepoint = timepointApi.current();
    const { timepointId } = currentTimepoint;
    const study = OHIF.viewer.Studies.findBy({
        studyInstanceUid: currentTimepoint.studyInstanceUids[0]
    });
    const report = new MeasurementReport({
        header: {
            trial: 'RECIST 1.1',
            patientName: OHIF.viewerbase.helpers.formatPN(study.patientName),
            mrn: study.patientId,
            timepoint: timepointApi.name(currentTimepoint)
        }
    });

    const createEnabledElement = () => {
        const $element = $('<div></div>').css({
            height: 512,
            left: 0,
            position: 'fixed',
            top: 0,
            visibility: 'hidden',
            width: 512,
            'z-index': -1
        });

        const element = $element[0];
        $element.appendTo(document.body);
        cornerstone.enable(element, { renderer: 'webgl' });

        const enabledElement = cornerstone.getEnabledElement(element);
        enabledElement.toolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

        return enabledElement;
    };

    const destroyEnabledElement = enabledElement => {
        cornerstone.disable(enabledElement.element);
        $(enabledElement.element).remove();
    };

    const printMeasurement = (measurement, image, callback) => {
        const enabledElement = createEnabledElement();
        const element = enabledElement.element;
        const series = cornerstoneTools.metaData.get('series', measurement.imageId);
        const instance = cornerstoneTools.metaData.get('instance', measurement.imageId);
        let info = measurement.response;
        if (!info) {
            info = measurement.longestDiameter;
            if (measurement.shortestDiameter) {
                info += ` × ${measurement.shortestDiameter}`;
            }

            info += ' mm';
        }

        info += ` (S:${series.seriesNumber}, I:${instance.instanceNumber})`;

        let type = measurementApi.toolsGroupsMap[measurement.toolType];
        type = type === 'targets' ? 'Target' : 'Non-target';

        const state = Object.assign({}, measurement, { active: true });
        cornerstone.displayImage(element, image);
        cornerstoneTools.addToolState(element, measurement.toolType, state);
        cornerstoneTools[measurement.toolType].enable(element);

        $(element).one('CornerstoneImageRendered', () => {
            report.printMeasurement({
                type,
                number: measurement.measurementNumber,
                location: OHIF.measurements.getLocationLabel(measurement.location) || '',
                info,
                image: enabledElement.canvas.toDataURL('image/jpeg', 0.85)
            });

            cornerstoneTools[measurement.toolType].disable(element);
            cornerstoneTools.clearToolState(element, measurement.toolType);

            destroyEnabledElement(enabledElement);

            processMeasurements(callback);
        });
    };

    const processMeasurements = callback => {
        const current = iterator.next();
        if (current.done) {
            callback();
            return;
        }

        const measurement = current.value;
        cornerstone.loadImage(measurement.imageId)
            .then(image => printMeasurement(measurement, image, callback));
    };

    const targets = measurementApi.fetch('targets', { timepointId });
    const nonTargets = measurementApi.fetch('nonTargets', { timepointId });
    const measurements = targets.concat(nonTargets);
    const iterator = measurements[Symbol.iterator]();

    processMeasurements(() => report.save('measurements.pdf'));
};
