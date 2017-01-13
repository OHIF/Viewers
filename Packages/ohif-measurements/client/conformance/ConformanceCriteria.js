import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { RecistChecker } from './checkers/RecistChecker';

class ConformanceCriteria {

    constructor(measurementApi, timepointApi) {
        this.measurementApi = measurementApi;
        this.timepointApi = timepointApi;

        this.warnings = {};
    }

    validate() {
        const data = this.getData();
        this.validateRecist(data);
    }

    validateRecist(data) {
        const recistChecker = new RecistChecker();
        console.warn('>>>>check', recistChecker.check(data));
    }

    /*
     * Build the data that will be used to do the conformance criteria checks
     */
    getData() {
        const data = {
            targets: [],
            nonTargets: []
        };

        const fillData = measurementType => {
            const measurements = this.measurementApi.fetch(measurementType);
            measurements.forEach(measurement => {
                const { studyInstanceUid, imageId } = measurement;
                const metadata = this.getImageMetadata(studyInstanceUid, imageId);
                const timepointId = measurement.timepointId;
                const timepoint = this.timepointApi.timepoints.findOne({ timepointId });

                data[measurementType].push({
                    measurement,
                    metadata,
                    timepoint
                });
            });
        };

        fillData('targets');
        fillData('nonTargets');

        return data;
    }

    getImageMetadata(studyInstanceUid, imageId) {
        const study = ViewerStudies.findOne({ studyInstanceUid });

        // Stop here if the study was not found
        if (!study) {
            return;
        }

        let foundImage;
        _.each(study.displaySets, displaySet => {
            if (foundImage) {
                return;
            }

            _.each(displaySet.images, image => {
                if (foundImage) {
                    return;
                } else if (getImageId(image) === imageId) {
                    foundImage = image;
                }
            });
        });

        return foundImage;
    }

}

OHIF.measurements.ConformanceCriteria = ConformanceCriteria;
