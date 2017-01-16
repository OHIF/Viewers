import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { CriteriaEvaluator } from './CriteriaEvaluator';
import * as evaluations from './evaluations';

class ConformanceCriteria {

    constructor(measurementApi, timepointApi) {
        this.measurementApi = measurementApi;
        this.timepointApi = timepointApi;
        this.nonConformities = new ReactiveVar();

        const validate = _.debounce(trialCriteriaType => {
            this.validate(trialCriteriaType);
        }, 300);

        Tracker.autorun(() => {
            const trialCriteriaType = TrialCriteriaTypes.findOne({ selected: true });
            this.measurementApi.changeObserver.depend();
            validate(trialCriteriaType);
        });
    }

    validate(trialCriteriaType) {
        const baselineData = this.getData('baseline');
        const followupData = this.getData('followup');
        const mergedData = baselineData;

        mergedData.targets = mergedData.targets.concat(followupData.targets);
        mergedData.nonTargets = mergedData.nonTargets.concat(followupData.nonTargets);

        const resultBoth = this.validateTimepoint('both', trialCriteriaType, mergedData);
        const resultBaseline = this.validateTimepoint('baseline', trialCriteriaType, baselineData);
        const resultFollowup = this.validateTimepoint('followup', trialCriteriaType, followupData);
        const nonConformities = resultBaseline.concat(resultFollowup).concat(resultBoth);

        this.nonConformities.set(nonConformities);

        return nonConformities;
    }

    validateTimepoint(timepointId, trialCriteriaType, data) {
        const evaluators = this.getEvaluators(timepointId, trialCriteriaType);
        let nonConformities = [];

        evaluators.forEach(evaluator => {
            const result = evaluator.evaluate(data);
            nonConformities = nonConformities.concat(result);
        });

        return nonConformities;
    }

    getEvaluators(timepointId, trialCriteriaType) {
        const evaluators = [];
        const trialCriteriaTypeId = trialCriteriaType.id.toLowerCase();
        const evaluation = evaluations[trialCriteriaTypeId]
        
        if(evaluation) {
            const evaluationTimepoint = evaluation[timepointId];

            if(evaluationTimepoint) {
                evaluators.push(new CriteriaEvaluator(evaluationTimepoint));
            }
        }

        return evaluators;
    }

    /*
     * Build the data that will be used to do the conformance criteria checks
     */
    getData(timepointType) {
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

                if((timepointType !== 'both') && (timepoint.timepointType !== timepointType)) {
                    return;
                }

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
