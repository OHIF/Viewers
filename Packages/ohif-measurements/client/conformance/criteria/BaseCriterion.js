export class BaseCriterion {

    constructor(options) {
        this.options = options;
    }

    generateResponse(message, measurements) {
        const passed = !message;
        return {
            passed,
            message,
            measurements
        };
    }

}
