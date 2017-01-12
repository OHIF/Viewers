import { BaseCriteria } from './BaseCriteria';

export class MaxTargetPerOrganCriteria extends BaseCriteria {

    constructor(targetsLimit) {
        super();
        this.targetsLimit = targetsLimit;
    }

    check(data) {
        const targetsPerOrgan = {};
        let message;
        let measurements = [];

        for (let i = 0; i < data.targets.length; i++) {
            const measurement = data.targets[i].measurement;
            const { location, measurementNumber } = measurement;
            if (!targetsPerOrgan[location]) {
                targetsPerOrgan[location] = new Set();
            }

            targetsPerOrgan[location].add(measurementNumber);
            if (targetsPerOrgan[location].size > this.targetsLimit) {
                measurements.push(measurement);
            }
        }

        if (measurements.length) {
            message = `Each organ should not have more than ${this.targetsLimit} targets.`;
        }

        return this.respond(message, measurements);
    }

}
