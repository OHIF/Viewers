export class BaseCriterion {

    constructor() {}

    generateResponse(message, measurements) {
        const passed = !message;
        return {
            passed,
            message,
            measurements
        };
    }

}
