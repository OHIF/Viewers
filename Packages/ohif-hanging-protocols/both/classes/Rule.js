import { Random } from 'meteor/random';

import { comparators } from '../lib/comparators';

const EQUALS_REGEXP = /^equals$/;

/**
 * This Class represents a Rule to be evaluated given a set of attributes
 * Rules have:
 * - An attribute (e.g. 'seriesDescription')
 * - A constraint Object, in the form required by Validate.js:
 *
 * rule.constraint = {
 *   contains: {
 *      value: 'T-1'
 *      }
 *   };
 *
 *  Note: In this example we use the 'contains' Validator, which is a custom Validator defined in Viewerbase
 *
 * - A value for whether or not they are Required to be matched (default: False)
 * - A value for their relative weighting during Protocol or Image matching (default: 1)
 */
export class Rule {
    /**
     * The Constructor for the Class to create a Rule with the bare
     * minimum information
     *
     * @param name The desired name for the Rule
     */
    constructor(attribute, constraint, required, weight) {
        // Create a new UUID for this Rule
        this.id = Random.id();

        // Set the Rule's weight (defaults to 1)
        this.weight = weight || 1;

        // If an attribute is specified, assign it
        if (attribute) {
            this.attribute = attribute;
        }

        // If a constraint is specified, assign it
        if (constraint) {
            this.constraint = constraint;
        }

        // If a value for 'required' is specified, assign it
        if (required === undefined) {
            // If no value was specified, default to False
            this.required = false;
        } else {
            this.required = required;
        }

        // Cache for constraint info object
        this._constraintInfo = void 0;

        // Cache for validator and value object
        this._validatorAndValue = void 0;
    }

    /**
     * Occasionally the Rule class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param input A Rule as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // Check if the input already has an ID
        // If so, keep it. It not, create a new UUID
        this.id = input.id || Random.id();

        // Assign the specified input data to the Rule
        this.required = input.required;
        this.weight = input.weight;
        this.attribute = input.attribute;
        this.constraint = input.constraint;
    }

    /**
     * Get the constraint info object for the current constraint
     * @return {Object\undefined} Constraint object or undefined if current constraint 
     *                            is not valid or not found in comparators list
     */
    getConstraintInfo() {
        let constraintInfo = this._constraintInfo;
        // Check if info is cached already
        if (constraintInfo !== void 0) {
            return constraintInfo;
        }

        const ruleConstraint = Object.keys(this.constraint)[0];

        if (ruleConstraint !== void 0) {
            constraintInfo = comparators.find(comparator => ruleConstraint === comparator.id)
        }

        // Cache this information for later use
        this._constraintInfo = constraintInfo;

        return constraintInfo;
    }

     /**
     * Check if current rule is related to priors
     * @return {Boolean} True if a rule is related to priors or false otherwise
     */
    isRuleForPrior() {
        // @TODO: Should we check this too? this.attribute === 'relativeTime'
        return this.attribute === 'abstractPriorValue';
    }

    /**
     * If the current rule is a rule for priors, returns the number of referenced priors. Otherwise, returns -1.
     * @return {Number} The number of referenced priors or -1 if not applicable. Returns zero if the actual value could not be determined.
     */
    getNumberOfPriorsReferenced() {
        if (!this.isRuleForPrior()) {
            return -1;
        }

        // Get rule's validator and value
        const ruleValidatorAndValue = this.getConstraintValidatorAndValue();
        const { value, validator } = ruleValidatorAndValue;
        const intValue = parseInt(value, 10) || 0; // avoid possible NaN

        // "Equal to" validators
        if (EQUALS_REGEXP.test(validator)) {
            // In this case, -1 (the oldest prior) indicates that at least one study is used
            return intValue < 0 ? 1 : intValue;
        }

        // Default cases return value
        return 0;
    }

    /**
     * Get the constraint validator and value
     * @return {Object|undefined} Returns an object containing the validator and it's value or undefined
     */
    getConstraintValidatorAndValue() {
        let validatorAndValue = this._validatorAndValue;
        
        // Check if validator and value are cached already
        if (validatorAndValue !== void 0) {
            return validatorAndValue;
        }

        // Get the constraint info object
        const constraintInfo = this.getConstraintInfo();

        // Constraint info object exists and is valid
        if (constraintInfo !== void 0) {
            const validator = constraintInfo.validator;
            const currentValidator = this.constraint[validator];

            if (currentValidator) {
                const constraintValidator = constraintInfo.validatorOption;
                const constraintValue = currentValidator[constraintValidator];

                validatorAndValue = {
                    value: constraintValue,
                    validator: constraintInfo.id
                };

                this._validatorAndValue = validatorAndValue;
            }
        }

        return validatorAndValue;
    }
}
