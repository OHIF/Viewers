import { BaseCriterion } from './BaseCriterion';

export const MaxTargetsSchema = {
  type: 'object',
  properties: {
    limit: {
      label: 'Max targets allowed in study',
      type: 'integer',
      minimum: 0,
    },
    newTarget: {
      label: 'Flag to evaluate only new targets',
      type: 'boolean',
    },
    locationIn: {
      label:
        'Filter to evaluate only measurements with the specified locations',
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      uniqueItems: true,
    },
    locationNotIn: {
      label:
        'Filter to evaluate only measurements without the specified locations',
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      uniqueItems: true,
    },
    isNodal: {
      label: 'Filter to evaluate only nodal or extranodal measurements',
      type: 'boolean'
    },
    message: {
      label: 'Message to be displayed in case of nonconformity',
      type: 'string',
    }
  },
  required: ['limit'],
};

/* MaxTargetsCriterion
 *   Check if the number of target measurements exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   newTarget: Flag to evaluate only new targets (must be evaluated on both)
 *   locationIn: Filter to evaluate only measurements with the specified locations
 *   locationNotIn: Filter to evaluate only measurements without the specified locations
 *   isNodal: Filter to evaluate only nodal or extranodal measurements
 *   message: Message to be displayed in case of nonconformity
 */
export class MaxTargetsCriterion extends BaseCriterion {
  constructor(...props) {
    super(...props);
  }

  evaluate(data) {
    const { options } = this;

    const newTargetNumbers = this.getNewTargetNumbers(data);
    const measurementNumbers = [];
    data.targets.forEach(target => {
      const { location, measurementNumber, isSplitLesion, isNodal } = target.measurement;

      if (isSplitLesion)
        return;

      if (typeof isNodal === 'boolean' && typeof options.isNodal === 'boolean' && options.isNodal !== isNodal)
        return;

      if (options.newTarget && !newTargetNumbers.has(measurementNumber))
        return;

      if (options.locationIn && options.locationIn.indexOf(location) === -1)
        return;

      if (options.locationNotIn && options.locationNotIn.indexOf(location) > -1)
        return;

      measurementNumbers.push(measurementNumber);
    });

    let lesionType = '';
    if (typeof options.isNodal === 'boolean') {
      lesionType = options.isNodal ? 'nodal ' : 'extranodal ';
    }

    let message;
    if (measurementNumbers.length > options.limit) {
      const increment = options.newTarget ? 'new ' : '';
      const plural = options.limit === 1 ? '' : 's';
      const amount = options.limit === 0 ? '' : `more than ${options.limit}`;
      message =
        options.message ||
        `The study should not have ${amount} ${increment}${lesionType}target${plural}.`;
    }

    return this.generateResponse(message);
  }
}
