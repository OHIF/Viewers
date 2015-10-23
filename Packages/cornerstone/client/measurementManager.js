(function($, cornerstoneTools) {

    'use strict';

    // This object manages a collection of measurements
    function MeasurementManager() {
        // Define some basic validator functions (everything is always valid)
        this.singleMeasurementValidator = function() {
            return {isValid: true};
        };

        this.measurementSetValidator = function() {
            return {isValid: true};
        };

        var that = this;
        that.measurements = [];

        // adds an element as both a source and a target
        this.add = function(measurement, validateSingle, validateSet) {
            var index = that.measurements.push(measurement);

            if (validateSingle === true) {
                measurementValid = singleMeasurementValidator(measurement);
            }

            if (validateSet === true) {
                measurementSetValid = measurementSetValidator(measurement);
            }

            // fire event
            var eventDetail = {
                index: index,
                measurement: measurement,
                measurementValid: measurementValid,
                measurementSetValid: measurementSetValid
            };

            $(that).trigger('CornerstoneMeasurementAdded', eventDetail);
        };

        this.remove = function(index) {
            var measurement = that.measurements[index];
            that.measurements.splice(index, 1);
            // fire event
            var eventDetail = {
                index: index,
                measurement: measurement
            };
            $(that).trigger('CornerstoneMeasurementRemoved', eventDetail);
        };

        // Add set/get measurementValidator to run on each single measurement
        // (e.g. length > 10 mm, location must be 30 mm from lymph node)
        this.setSingleMeasurementValidator = function(validator) {
            this.singleMeasurementValidator = validator;
        };

        this.getSingleMeasurementValidator = function(validator) {
            return singleMeasurementValidator;
        };

        // Add set/get groupValidator to run on all of the measurements together
        // (e.g. the number of measurments must be <= 2)
        this.setMeasurementSetValidator = function(validator) {
            this.measurementSetValidator = validator;
        };

        this.getMeasurementSetValidator = function(validator) {
            return measurementSetValidator;
        };
    }

    // module/private exports
    cornerstoneTools.MeasurementManager = new MeasurementManager();

})($, cornerstoneTools);