import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { CriteriaEvaluator } from './CriteriaEvaluator';
import * as recistBaselineEvaluation from './evaluations/recistBaseline.json';

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
        const recistBaselineEvaluator = new CriteriaEvaluator(recistBaselineEvaluation);
        console.warn('>>>>check', recistBaselineEvaluator.evaluate(data));
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
