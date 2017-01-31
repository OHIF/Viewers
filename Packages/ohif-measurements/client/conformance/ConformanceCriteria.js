import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';
import { CriteriaEvaluator } from './CriteriaEvaluator';
import * as evaluations from './evaluations';

class ConformanceCriteria {

    constructor(measurementApi, timepointApi) {
        this.measurementApi = measurementApi;
        this.timepointApi = timepointApi;
        this.nonconformities = new ReactiveVar();
        this.groupedNonConformities = new ReactiveVar();
        this.maxTargets = new ReactiveVar(null);

        const validate = _.debounce(trialCriteriaType => {
            if (Session.get('MeasurementsReady')) return;
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

        this.maxTargets.set(null);
        const resultBoth = this.validateTimepoint('both', trialCriteriaType, mergedData);
        const resultBaseline = this.validateTimepoint('baseline', trialCriteriaType, baselineData);
        const resultFollowup = this.validateTimepoint('followup', trialCriteriaType, followupData);
        const nonconformities = resultBaseline.concat(resultFollowup).concat(resultBoth);
        const groupedNonConformities = this.groupNonConformities(nonconformities);

        // Keep both? Group the data only on viewer/measurementTable views?
        // Work with not grouped data (worse lookup performance on measurementTableRow)?
        this.nonconformities.set(nonconformities);
        this.groupedNonConformities.set(groupedNonConformities);

        return nonconformities;
    }

    groupNonConformities(nonconformities) {
        const groups = {};
        const toolsGroupsMap = this.measurementApi.toolsGroupsMap;

        nonconformities.forEach(nonConformity => {
            if (nonConformity.isGlobal) {
                groups.globals = groups.globals || { messages: [] };
                groups.globals.messages.push(nonConformity.message);

                return;
            }

            nonConformity.measurements.forEach(measurement => {
                const groupName = toolsGroupsMap[measurement.toolType];
                groups[groupName] = groups[groupName] || { measurementNumbers: {} };

                const group = groups[groupName];
                const measureNumber = measurement.measurementNumber;
                let measurementNumbers = group.measurementNumbers[measureNumber];

                if (!measurementNumbers) {
                    measurementNumbers = group.measurementNumbers[measureNumber] = {
                        messages: [],
                        measurements: []
                    };
                }

                measurementNumbers.messages.push(nonConformity.message);
                measurementNumbers.measurements.push(measurement);
            });
        });

        return groups;
    }

    validateTimepoint(timepointId, trialCriteriaType, data) {
        const evaluators = this.getEvaluators(timepointId, trialCriteriaType);
        let nonconformities = [];

        evaluators.forEach(evaluator => {
            const maxTargets = evaluator.getMaxTargets();
            if (maxTargets) {
                this.maxTargets.set(maxTargets);
            }

            const result = evaluator.evaluate(data);
            nonconformities = nonconformities.concat(result);
        });

        return nonconformities;
    }

    getEvaluators(timepointId, trialCriteriaType) {
        const evaluators = [];
        const trialCriteriaTypeId = trialCriteriaType.id.toLowerCase();
        const evaluation = evaluations[trialCriteriaTypeId];

        if (evaluation) {
            const evaluationTimepoint = evaluation[timepointId];

            if (evaluationTimepoint) {
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
                const metadata = this.getImageInstanceMetadata(studyInstanceUid, imageId);
                const timepointId = measurement.timepointId;
                const timepoint = this.timepointApi.timepoints.findOne({ timepointId });

                if ((timepointType !== 'both') && (timepoint.timepointType !== timepointType)) {
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

    getImageInstanceMetadata(studyInstanceUid, imageId) {
        const study = OHIF.viewer.Studies.findBy({ studyInstanceUid });

        // Stop here if the study was not found
        if (!study) {
            return;
        }

        const metadata = OHIF.cornerstone.metadataProvider.getMetadata(imageId);
        return metadata ? metadata.instance : undefined;
    }

}

OHIF.measurements.ConformanceCriteria = ConformanceCriteria;
