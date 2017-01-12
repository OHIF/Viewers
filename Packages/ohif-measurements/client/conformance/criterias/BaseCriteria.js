export class BaseCriteria {

    constructor() {}

    respond(response, measurements) {
        const passed = !response;
        return {
            passed,
            message: response,
            measurements
        };
    }

}
