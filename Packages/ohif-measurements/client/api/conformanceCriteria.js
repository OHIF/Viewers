import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

class ConformanceCriteriaApi {

    constructor(measurementApi) {
        if (measurementApi) {
            this.measurementApi = measurementApi;
        }

        this.warnings = {};
    }

    validate() {
        this.validateRecist();
    }

    validateRecist() {
        const measurements = this.getMeasurements();

        measurements.targets.forEach(measurement => {
            const image = this.getImageById(measurement.studyInstanceUid, measurement.imageId);
            console.warn('>>>>modality', image, image.modality);
        });
    }

    getMeasurements() {
        const targets = this.measurementApi.fetch('targets');
        const nonTargets = this.measurementApi.fetch('nonTargets');
        return {
            targets,
            nonTargets
        };
    }

    getImageById(studyInstanceUid, imageId) {
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

OHIF.measurements.ConformanceCriteriaApi = ConformanceCriteriaApi;
