import { BaseCriterion } from './BaseCriterion';

export const TargetTypeSchema = {
  type: 'object',
};

/* TargetTypeCriterion
 *   Check if the there are non-bidirectional target measurements on baseline
 */
export class TargetTypeCriterion extends BaseCriterion {
  constructor(...props) {
    super(...props);
  }

  evaluate(data) {
    const items = data.targets;
    const measurements = [];
    let message;

    items.forEach(item => {
      const measurement = item.measurement;

      if (
        measurement.toolType !== 'Bidirectional' &&
        !measurement.bidirectional
      ) {
        measurements.push(measurement);
      }
    });

    if (measurements.length) {
      message =
        'Target lesions must have measurements (cannot be assessed as CR, UN/NE, EX)';
    }

    return this.generateResponse(message, measurements);
  }
}
