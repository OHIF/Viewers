/**
 * Calculates total lesion burden given the Trial Criteria Type.
 * Supports RECIST 1.1 and irRC at present, defaults to RECIST.
 *
 * @param criteriaType Either 'RECIST' or 'irRC'
 * @returns {*}
 */
calculateTotalLesionBurden = function(criteriaType) {
    var totalBurden;
    var measurements = Measurements.find({
        isTarget: true
    });

    switch (criteriaType) {
        default:
        case 'RECIST':
            // - Time Point Measurement Total =
            // Sum of long axis measurements for extranodal target lesion +
            //        short axis measurements for nodal lesions
            var sumLongAxisExtranodal = 0,
                sumShortAxisNodal = 0;

            measurements.forEach(function(measurement) {
                var LD = parseFloat(measurement.longestDiameter);
                var SD = parseFloat(measurement.shortestDiameter);

                if (measurement.nodal === true) {
                    sumShortAxisNodal += SD;
                } else {
                    sumLongAxisExtranodal += LD;
                }
            });

            totalBurden = sumLongAxisExtranodal + sumShortAxisNodal;
            break;
        case 'irRC':
            // - Time Point Measurement Total = SPD target lesions + SPD new lesions
            // (SPD = sum of product of long axis and short axis diameters)
            var sumProductLesions = 0,
                sumProductNewLesions = 0;

            measurements.forEach(function(measurement) {
                var LD = parseFloat(measurement.longestDiameter);
                var SD = parseFloat(measurement.shortestDiameter);
                var product = LD * SD;

                if (measurement.newLesion === true) {
                    sumProductNewLesions += product;
                } else {
                    sumProductLesions += product;
                }
            });

            totalBurden = sumProductLesions + sumProductNewLesions;
            break;
    }

    return totalBurden;
};
