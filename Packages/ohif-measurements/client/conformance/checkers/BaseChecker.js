export class BaseChecker {

    constructor() {
        this.criteria = [];
    }

    check(data) {
        const nonconformity = [];
        this.criteria.forEach(criterion => {
            const criterionResult = criterion.evaluate(data);
            if (!criterionResult.passed) {
                nonconformity.push(criterionResult);
            }
        });
        return nonconformity;
    }

}
