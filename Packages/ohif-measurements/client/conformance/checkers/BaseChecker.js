export class BaseChecker {

    constructor() {
        this.criterias = [];
    }

    check(data) {
        const nonconformity = [];
        this.criterias.forEach(criteria => {
            const criteriaResult = criteria.check(data);
            if (!criteriaResult.passed) {
                nonconformity.push(criteriaResult);
            }
        });
        return nonconformity;
    }

}
