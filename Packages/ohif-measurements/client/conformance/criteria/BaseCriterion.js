export class BaseCriterion {

    constructor(options) {
        this.options = options;
    }

    generateResponse(message, measurements) {
        const passed = !message;
        const isGlobal = !measurements || !measurements.length;

        return {
            passed,
            isGlobal,
            message,
            measurements
        };
    }

}
