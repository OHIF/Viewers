sortStudy = function(study) {
    if (!study) {
        return;
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