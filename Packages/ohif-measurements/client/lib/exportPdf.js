import { OHIF } from 'meteor/ohif:core';
import { MeasurementReport } from 'meteor/ohif:measurements/client/reports/measurement';

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

    const printMeasurement = (measurement, callback) => {
        OHIF.measurements.getImageDataUrl({ measurement }).then(imageDataUrl => {
            const imageId = OHIF.viewerbase.getImageIdForImagePath(measurement.imagePath);
            const series = cornerstone.metaData.get('series', imageId);
            const instance = cornerstone.metaData.get('instance', imageId);

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

            report.printMeasurement({
                type,
                number: measurement.measurementNumber,
                location: OHIF.measurements.getLocationLabel(measurement.location) || '',
                info,
                image: imageDataUrl
            });

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
        printMeasurement(measurement, callback);
    };

    const targets = measurementApi.fetch('targets', { timepointId });
    const nonTargets = measurementApi.fetch('nonTargets', { timepointId });
    const measurements = targets.concat(nonTargets);
    const iterator = measurements[Symbol.iterator]();

    processMeasurements(() => report.save('measurements.pdf'));
};
