/**
 * Sorts the series and instances inside a study instance by their series
 * and instance numbers in ascending order.
 *
 * @param {Object} study The study instance
 */
sortStudy = function(study) {
    if (!study || !study.seriesList) {
        throw "Insufficient study data was provided to sortStudy";
    }
    
    study.seriesList.sort(function(a, b) {
        return a.seriesNumber - b.seriesNumber;
    });

    study.seriesList.forEach(function(series){
        series.instances.sort(function(a, b) {
            return a.instanceNumber - b.instanceNumber;
        });
    });
};