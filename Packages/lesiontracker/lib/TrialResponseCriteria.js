// Create a client-only Collection to store our Validation Errors
ValidationErrors = new Meteor.Collection(null);
ValidationErrors._debugName = 'ValidationErrors';

// Set Validate.js Library's default options
validate.options = {
    format: 'detailed'
};

/**
 * Creates an array of validation error messages given an Object of validation errors
 * and an optional prefix for the messages. An example of a useful prefix would be
 * the location of the measurement or something like 'Target 1 '.
 *
 * @param validationErrors
 * @param prefix
 */
function addValidationErrorsToCollection(validationErrors, prefix, type) {
    // If no input was given, stop here
    if (!validationErrors || !validationErrors.length) {
        return;
    }

    // Loop through each of the entries in the validationErrors Array
    validationErrors.forEach(function(validationError) {
        var existingError = ValidationErrors.findOne({
            attribute: validationError.attribute,
            validator: validationError.validator,
            error: validationError.error,
            prefix: prefix
        });

        if (existingError) {
            ValidationErrors.update(existingError._id, {
                $set: {
                    value: validationError.value
                }
            });
        } else {
            validationError.type = type;
            validationError.prefix = prefix;
            ValidationErrors.insert(validationError);
        }
    });
}

/**
 * Runs conformance checks related to a group of measurements. This function
 * searches the input object of Constraints and looks for the 'group' attribute.
 *
 * It calculates some general group-level values for the current set of Measurements
 * and validates these using the input constraints.
 *
 * @param constraints
 * @returns {Array} Array of error messages related to the input conformance checks
 */
function assessGroupOfMeasurements(constraints) {
    log.info('assessGroupOfMeasurements');

    // Retrieve the group-level constraints
    var groupConstraints = constraints.group;

    // If no group-level constraints exist, stop here
    if (!groupConstraints) {
        return;
    }

    var type = 'group';
    ValidationErrors.remove({
        type: type
    });

    // Calculate some simple group-level Measurement statistics for validation
    var testStructure = {
        totalNumberOfLesions: Measurements.find().count()
    };

    // Run the conformance checks with the validate.js library
    var validationErrors = validate(testStructure, groupConstraints);

    // Return any error messages as a flattened array of errors
    addValidationErrorsToCollection(validationErrors, '', type);
}

/**
 * Runs conformance checks related to per-organ sets of measurements.
 *
 * This function searches the input object of Constraints and looks for the
 * 'perOrgan' attribute.
 *
 * It calculates some general per-organ statistics for the current set of Measurements
 * and validates these using the input constraints.
 *
 * @param constraints
 * @returns {Array} Array of error messages related to the input conformance checks
 */
function assessMeasurementPerOrgan(constraints) {
    log.info('assessMeasurementPerOrgan');

    // Retrieve the per-organ constraints
    var perOrganConstraints = constraints.perOrgan;

    // If no per-organ constraints exist, stop here
    if (!perOrganConstraints) {
        return;
    }

    // Create a list of all unique locations that contain measurements
    // by looping through the Measurements Collection
    var organLocations = [];
    Measurements.find().forEach(function(measurement) {
        if (organLocations.indexOf(measurement.location) > -1) {
            return;
        }

        organLocations.push(measurement.location);
    });

    var type = 'perOrgan';
    ValidationErrors.remove({
        type: type
    });

    // Loop through each unique organ location in order to validate
    // the per-organ constraints for each organ
    organLocations.forEach(function(location) {
        // Calculate the number of Lesions per Organ
        var numberOfLesionsPerOrgan = Measurements.find({
            location: location
        }).count();

        // Store per-organ Measurement statistics for validation
        // Right now this is only the numberOfLesionsPerOrgan, but later
        // this may include other checks
        var testStructure = {
            numberOfLesionsPerOrgan: numberOfLesionsPerOrgan
        };

        // Run the conformance checks with the validate.js library
        var validationErrors = validate(testStructure, perOrganConstraints);

        // Obtain any error messages as a flattened array of errors, prefixed
        // with the Organ name, in the form 'Liver Left: '
        addValidationErrorsToCollection(validationErrors, location + ': ', type);
    });
}

/**
 * Runs conformance checks on a single Measurement given the
 * cornerstone toolData related to it.
 *
 * @param constraints
 * @param measurementData CornerstoneTools toolData Object for this specific Measurement
 * @returns {Array} Array of error messages related to the input conformance checks
 */
function assessSingleMeasurement(constraints, measurementData) {
    log.info('assessSingleMeasurement');

    // Check whether this is a Target or Non-Target Measurement
    var targetType = measurementData.isTarget ? 'target' : 'nonTarget';

    // Retrieve any target/non-target-specific single-measurement constraints
    // from the input constraint structure
    var measurementConstraints = constraints[targetType];

    // If no relevant constraints exist, stop here
    if (!measurementConstraints) {
        return;
    }

    // Check whether this is a Nodal or Extranodal Measurement
    var nodalType = measurementData.isNodal ? 'nodal' : 'extraNodal';

    // Retrieve any nodal/extra-nodal-specific constraints to see if we can apply them
    var constraintsToApply;
    if (measurementData.isNodal !== undefined && measurementConstraints[nodalType]) {
        // Check if we have enough information (about nodality of this Measurement,
        // and nodality-specific constraints) to apply nodality-specific constraints
        constraintsToApply = measurementConstraints[nodalType];
    } else if (measurementConstraints.all) {
        // If we have no data about the nodality of this Measurement, or no relevant
        // specific constraints, we should apply the constraints valid for 'all' nodality
        // types
        constraintsToApply = measurementConstraints.all;
    }

    // Calculate a lesion name based on whether or not we have a Target or Non-target
    // Measurement, and the lesion number of this Measurement.
    var lesionName = measurementData.isTarget ? 'Target' : 'Non-target';
    lesionName = lesionName + ' ' + measurementData.lesionNumber + ': ';

    ValidationErrors.remove({
        prefix: lesionName
    });

    // Use validate.js to check the criteria
    var validationErrors = validate(measurementData, constraintsToApply);

    if (validationErrors) {
        validationErrors.forEach(function(error) {
            error.measurementId = measurementData._id;
        });
    }

    // Use the Lesion Name as a prefix to concatenate any validation error messages into
    // an array to return
    addValidationErrorsToCollection(validationErrors, lesionName);
}

/**
 * Validate from a single Measurement up the chain to include group and perOrgan
 * conformance checks
 *
 * @param measurementData The CornerstoneTools toolData for a single Measurement
 */
function validateSingleMeasurement(measurementData) {
    // Obtain the name of the current TrialResponseAssessmentCriteria that
    // we are using.
    var criteriaTypes = TrialCriteriaTypes.find({
        selected: true
    }).map(function(criteria) {
        return criteria.id;
    });
    var currentConstraints = getTrialCriteriaConstraints(criteriaTypes, measurementData.imageId);

    // If we have no relevant constraints, stop here
    if (!currentConstraints) {
        return;
    }

    // Find the relevant Measurement in the Measurements Collection
    var measurement = Measurements.findOne(measurementData.id);

    // If no such Measurement exists, stop here
    if (!measurement) {
        return;
    }

    // Find the current timepointId that the user was editing the Measurement on
    var timepointId = measurementData.timepointId;

    // Find the specific measurement data for this Measurement at this Timepoint
    var currentMeasurement = measurement.timepoints[timepointId];

    // Return here if the measurement was removed during validation
    if (!currentMeasurement) {
        return;
    }

    // Include target and nodal flags on the timepoint-specific data so it is easier to validate
    // TODO: Rethink what to pass to assessSingleMeasurement?
    currentMeasurement.isTarget = measurement.isTarget;
    currentMeasurement.isNodal = measurement.isNodal;
    currentMeasurement.lesionNumber = measurement.lesionNumber;
    currentMeasurement._id = measurement._id;

    // Run the single-measurement-specific conformance checks
    // If any messages exist, add them to the array of messages
    assessSingleMeasurement(currentConstraints, currentMeasurement);

    validateGroups();
}

function validateGroups() {
    log.info('validateGroups');

    // Obtain the names of the current TrialResponseAssessmentCriteria that
    // we are using.
    var criteriaTypes = TrialCriteriaTypes.find({
        selected: true
    }).map(function(criteria) {
        return criteria.id;
    });

    // Criteria for the specific image are retrieved from the general set of criteria.
    var currentConstraints = getTrialCriteriaConstraints(criteriaTypes);
    if (!currentConstraints) {
        return;
    }

    // TODO: Revisit this! We can't use the Timepoints collection inside ANY
    // of these functions, since it causes an infinite loop, since Measurement
    // validation is performed inside the observe:added hook for the Measurements
    // Collection. 

    var timepointTypes = ['baseline', 'followup'];
    timepointTypes.forEach(function(timepointType) {
        // Retrieve the current constraints which apply to the specific Timepoint type
        // (e.g. baseline, followup) that this Measurement is being edited on.
        var timepointConstraints = currentConstraints[timepointType];
        if (!timepointConstraints) {
            return;
        }

        // Run the group-level conformance checks
        assessGroupOfMeasurements(timepointConstraints);

        // Run the per-organ conformance checks
        assessMeasurementPerOrgan(timepointConstraints);
    });
}

function validateAll() {
    // Obtain the names of the current TrialResponseAssessmentCriteria that
    // we are using.
    var criteriaTypes = TrialCriteriaTypes.find({
        selected: true
    }).map(function(criteria) {
        return criteria.id;
    });

    Measurements.find().forEach(function(measurement) {
        Object.keys(measurement.timepoints).forEach(function(timepointId) {
            var currentMeasurement = measurement.timepoints[timepointId];
            currentMeasurement.isTarget = measurement.isTarget;
            currentMeasurement.isNodal = measurement.isNodal;
            currentMeasurement.lesionNumber = measurement.lesionNumber;
            currentMeasurement._id = measurement._id;

            // Criteria for the specific image are retrieved from the general set of criteria.
            var currentConstraints = getTrialCriteriaConstraints(criteriaTypes, currentMeasurement.imageId);
            if (!currentConstraints) {
                return;
            }

            // Run the single-measurement-specific conformance checks
            // If any messages exist, add them to the array of messages
            assessSingleMeasurement(currentConstraints, currentMeasurement);
        });
    });

    validateGroups();
}

var validationTimeout = 400;

/**
 * Validate the measurements after a set delay period
 *
 * @param measurementData Input measurement data from CornerstoneTools
 */
function validateDelayed(measurementData) {
    // Erase any currently-waiting validation call
    clearTimeout(validationTimeout);

    // Set a timeout to run validation after a delay
    // Currently this is 400 milliseconds
    setTimeout(function() {
        validateSingleMeasurement(measurementData);
    }, validationTimeout);
}

/**
 * Validate all measurements after a set delay period
 */
function validateAllDelayed() {
    // Erase any currently-waiting validation call
    clearTimeout(validationTimeout);

    // Set a timeout to run validation after a delay
    // Currently this is 400 milliseconds
    setTimeout(function() {
        validateAll();
    }, validationTimeout);
}

TrialResponseCriteria = {
    validateAll: validateAll,
    validateAllDelayed: validateAllDelayed,
    validateSingleMeasurement: validateSingleMeasurement,
    validateDelayed: validateDelayed,
    validateGroups: validateGroups
};
