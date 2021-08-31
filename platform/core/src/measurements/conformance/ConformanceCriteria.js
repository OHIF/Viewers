import { CriteriaEvaluator } from './CriteriaEvaluator';
import * as initialEvaluations from './evaluations';
import log from '../../log';

const evaluations = Object.assign({}, initialEvaluations);

const BASELINE = 'baseline';
const FOLLOWUP = 'followup';
const BOTH = 'both';
const TARGETS = 'targets';
const NONTARGETS = 'nonTargets';

class ConformanceCriteria {
  constructor(measurementApi, timepointApi, options = {}) {
    this.measurementApi = measurementApi;
    this.timepointApi = timepointApi;
    this.nonconformities = [];
    this.groupedNonConformities = [];
    this.maxTargets = null;
    this.maxNewTargets = null;
    this.options = options;
  }

  loadStudy(StudyInstanceUID) {
    if (typeof this.options.loadStudy !== 'function') {
      throw new Error('loadStudy callback is not defined');
    }

    return this.options.loadStudy(null, StudyInstanceUID);
  }

  async validate(trialCriteriaType) {
    const baselinePromise = this.getData(BASELINE);
    const followupPromise = this.getData(FOLLOWUP);
    const [baselineData, followupData] = await Promise.all([
      baselinePromise,
      followupPromise,
    ]);
    const mergedData = {
      targets: [],
      nonTargets: [],
    };

    mergedData.targets = mergedData.targets.concat(baselineData.targets);
    mergedData.targets = mergedData.targets.concat(followupData.targets);
    mergedData.nonTargets = mergedData.nonTargets.concat(
      baselineData.nonTargets
    );
    mergedData.nonTargets = mergedData.nonTargets.concat(
      followupData.nonTargets
    );

    this.maxTargets = null;
    this.maxNewTargets = null;
    const resultBoth = this.validateTimepoint(
      BOTH,
      trialCriteriaType,
      mergedData
    );
    const resultBaseline = this.validateTimepoint(
      BASELINE,
      trialCriteriaType,
      baselineData
    );
    const resultFollowup = this.validateTimepoint(
      FOLLOWUP,
      trialCriteriaType,
      followupData
    );
    const nonconformities = resultBaseline
      .concat(resultFollowup)
      .concat(resultBoth);
    const groupedNonConformities = this.groupNonConformities(nonconformities);

    // Keep both? Group the data only on viewer/measurementTable views?
    // Work with not grouped data (worse lookup performance on measurementTableRow)?
    this.nonconformities = nonconformities;
    this.groupedNonConformities = groupedNonConformities;

    console.warn('nonconformities');
    console.warn(nonconformities);
    console.warn('groupedNonConformities');
    console.warn(groupedNonConformities);

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
            measurements: [],
          };
        }

        measurementNumbers.messages.push(nonConformity.message);
        measurementNumbers.measurements.push(measurement);
      });
    });

    return groups;
  }

  validateTimepoint(timepointType, trialCriteriaType, data) {
    const evaluators = this.getEvaluators(timepointType, trialCriteriaType);
    let nonconformities = [];

    evaluators.forEach(evaluator => {
      const maxTargets = evaluator.getMaxTargets(false);
      const maxNewTargets = evaluator.getMaxTargets(true);
      if (maxTargets) {
        this.maxTargets = maxTargets;
      }

      if (maxNewTargets) {
        this.maxNewTargets = maxNewTargets;
      }

      const result = evaluator.evaluate(data);

      if (result.length > 0) {
        result.forEach(resultItem => {
          resultItem.timepointType = timepointType;
        });
      }

      nonconformities = nonconformities.concat(result);
    });

    return nonconformities;
  }

  getEvaluators(timepointType, trialCriteriaType) {
    const evaluators = [];
    console.warn(evaluations);
    const trialCriteriaTypeId = trialCriteriaType.id.toLowerCase();
    const evaluation = evaluations[trialCriteriaTypeId];

    if (evaluation) {
      const evaluationTimepoint = evaluation[timepointType];

      if (evaluationTimepoint) {
        evaluators.push(new CriteriaEvaluator(evaluationTimepoint));
      }
    }

    return evaluators;
  }

  /*
   * Build the data that will be used to do the conformance criteria checks
   */
  async getData(timepointType) {
    const data = {
      targets: [],
      nonTargets: [],
    };

    const studyPromises = [];

    const fillData = measurementType => {
      const measurements = this.measurementApi.fetch(measurementType);

      measurements.forEach(measurement => {
        const { StudyInstanceUID } = measurement;

        const timepointId = measurement.timepointId;
        const timepoint =
          timepointId &&
          this.timepointApi.timepoints.find(a => a.timepointId === timepointId);

        if (
          !timepoint ||
          (timepointType !== BOTH && timepoint.timepointType !== timepointType)
        ) {
          return;
        }

        const promise = this.loadStudy(StudyInstanceUID);
        promise.then(
          studyMetadata => {
            data[measurementType].push({
              measurement,
              metadata: studyMetadata.getFirstInstance(),
              timepoint,
            });
          },
          error => {
            throw new Error(error);
          }
        );
        studyPromises.push(promise);
      });
    };

    fillData(TARGETS);
    fillData(NONTARGETS);

    await Promise.all(studyPromises);

    return data;
  }

  static setEvaluationDefinitions(evaluationKey, evaluationDefinitions) {
    evaluations[evaluationKey] = evaluationDefinitions;
  }
}

export default ConformanceCriteria;
//OHIF.measurements.ConformanceCriteria = ConformanceCriteria;
