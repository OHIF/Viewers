var hangingProtocol;

function defaultHangingProtocol(inputData) {
    var studies = inputData.studies;
    var viewportRows = inputData.viewportRows;
    var viewportColumns = inputData.viewportColumns;

    // This is the most basic hanging protocol.
    var stacks = [];
    studies.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            var stack = {
                series: series,
                study: study
            };
            stacks.push(stack);
        });
    });

    var viewportData = [];

    var numViewports = viewportRows * viewportColumns;
    for (var i=0; i < numViewports; ++i) {
        if (i >= stacks.length) {
            // We don't have enough stacks to fill the desired number of viewports, so stop here
            break;
        }
        viewportData[i] = {
            seriesInstanceUid: stacks[i].series.seriesInstanceUid,
            studyInstanceUid: stacks[i].study.studyInstanceUid,
            currentImageIdIndex: 0
        };
    }
    return viewportData;
}

getHangingProtocol = function() {
    return hangingProtocol;
};

setHangingProtocol = function(protocol) {
    hangingProtocol = protocol;
};

setHangingProtocol(defaultHangingProtocol);
