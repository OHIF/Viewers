import { OHIF } from 'meteor/ohif:core';

class RecistApi {

    constructor(measurementApi) {
        if (measurementApi) {
            this.measurementApi = measurementApi;
        }
        this.warnings = {};
    }

    validate() {

    }

    getModalities() {

    }

}

OHIF.measurements.RecistApi = RecistApi;
