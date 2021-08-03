import { BaseCriterion } from './BaseCriterion';

export const LocationSchema = {
  type: 'object',
};

/* LocationCriterion
 *   Check if the there are non-target measurements with response different than "present" on baseline
 */
export class LocationCriterion extends BaseCriterion {
  constructor(...props) {
    super(...props);
  }

  evaluate(data) {
    const items = data.targets.concat(data.nonTargets);
    const measurements = [];
    let message;

    items.forEach(item => {
      const measurement = item.measurement;

      if (!measurement.location) {
        measurements.push(measurement);
      }
    });

    if (measurements.length) {
      message = 'All measurements should have a location';
    }

    return this.generateResponse(message, measurements);
  }
}
