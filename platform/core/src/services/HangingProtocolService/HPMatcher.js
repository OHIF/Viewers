import validate from './lib/validator';

/**
 * Match a Metadata instance against rules using Validate.js for validation.
 * @param  {InstanceMetadata} metadataInstance Metadata instance object
 * @param  {Array} rules Array of MatchingRules instances (StudyMatchingRule|SeriesMatchingRule|ImageMatchingRule) for the match
 * @param {object} options is an object containing additional information
 * @param {object[]} options.studies is a list of all the studies
 * @param {object[]} options.displaySets is a list of the display sets
 * @return {Object}      Matching Object with score and details (which rule passed or failed)
 */
const match = (metadataInstance, rules = [], customAttributeRetrievalCallbacks, options) => {
  const validateOptions = {
    format: 'grouped',
  };

  const details = {
    passed: [],
    failed: [],
  };

  const readValues = {};

  let requiredFailed = false;
  let score = 0;

  // Allow for matching against current or prior specifically
  const prior = options?.studies?.[1];
  const current = options?.studies?.[0];
  const instance = metadataInstance.instances?.[0];
  const fromSrc = {
    prior,
    current,
    instance,
    ...options,
    options,
    metadataInstance,
  };

  rules.forEach(rule => {
    const { attribute, from = 'metadataInstance' } = rule;
    // Do not use the custom attribute from the metadataInstance since it is subject to change
    if (customAttributeRetrievalCallbacks.hasOwnProperty(attribute)) {
      readValues[attribute] = customAttributeRetrievalCallbacks[attribute].callback.call(
        rule,
        metadataInstance,
        options
      );
    } else {
      readValues[attribute] = fromSrc[from]?.[attribute] ?? instance?.[attribute];
    }

    // handle cases where the constraint is also a custom attribute
    const resolvedConstraint = resolveConstraintAttributes(
      readValues,
      rule.constraint,
      customAttributeRetrievalCallbacks,
      fromSrc
    );

    // Format the constraint as required by Validate.js
    const testConstraint = {
      [attribute]: resolvedConstraint,
    };

    // Create a single attribute object to be validated, since metadataInstance is an
    // instance of Metadata (StudyMetadata, SeriesMetadata or InstanceMetadata)
    const attributeMap = {
      [attribute]: readValues[attribute],
    };

    // Use Validate.js to evaluate the constraints on the specified metadataInstance
    let errorMessages;
    try {
      errorMessages = validate(attributeMap, testConstraint, [validateOptions]);
    } catch (e) {
      errorMessages = ['Something went wrong during validation.', e];
    }

    // TODO: move to a logger
    // console.log(
    //   'Test',
    //   `${from}.${attribute}`,
    //   readValues[attribute],
    //   JSON.stringify(rule.constraint),
    //   !errorMessages
    // );

    if (!errorMessages) {
      // If no errorMessages were returned, then validation passed.

      // Add the rule's weight to the total score
      score += parseInt(rule.weight || 1, 10);
      // Log that this rule passed in the matching details object
      details.passed.push({
        rule,
      });
    } else {
      // If errorMessages were present, then validation failed

      // If the rule that failed validation was Required, then
      // mark that a required Rule has failed
      if (rule.required) {
        requiredFailed = true;
      }

      // Log that this rule failed in the matching details object
      // and include any error messages
      details.failed.push({
        rule,
        errorMessages,
      });
    }
  });

  // If a required Rule has failed Validation, set the matching score to zero
  if (requiredFailed) {
    score = 0;
  }

  return {
    score,
    details,
    requiredFailed,
  };
};

// New helper function to resolve constraint attributes
const resolveConstraintAttributes = (
  readValues,
  constraint,
  customAttributeRetrievalCallbacks,
  fromSrc
) => {
  if (typeof constraint !== 'object' || constraint === null) {
    return constraint;
  }

  const resolvedConstraint = {};
  Object.entries(constraint).forEach(([key, value]) => {
    if (typeof value === 'object' && Object.keys(value).length > 0 && 'attribute' in value) {
      const attributeName = value.attribute;
      const attributeFrom = value.from ?? 'metadataInstance';

      if (customAttributeRetrievalCallbacks.hasOwnProperty(attributeName)) {
        const value = customAttributeRetrievalCallbacks[attributeName].callback.call(
          null,
          fromSrc[attributeFrom],
          fromSrc.options
        );

        resolvedConstraint[key] = {
          value,
        };
      } else {
        resolvedConstraint[key] = {
          value:
            fromSrc[attributeFrom]?.[attributeName] ?? fromSrc.metadataInstance?.[attributeName],
        };
      }
    } else {
      resolvedConstraint[key] = value;
    }
  }, {});

  return resolvedConstraint;
};

const HPMatcher = {
  match,
};

export { HPMatcher };
