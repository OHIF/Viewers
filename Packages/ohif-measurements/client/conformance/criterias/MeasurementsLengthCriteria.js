import { BaseCriteria } from './BaseCriteria';

export class MeasurementsLengthCriteria extends BaseCriteria {

    constructor(options) {
        super();
        options = {
            shortAxis: 10,
            longAxis: 10,
            shortAxisSliceThicknessMultiplier: 2,
            longAxisSliceThicknessMultiplier: 2,
            modalitiesIn: ['CT', 'MR'],
            locationNotIn: ['Lymph Node']
        };
        this.options = options;
    }

    check(data) {
        let message;
        let measurements = [];

        return this.respond(message, measurements);
    }

}
