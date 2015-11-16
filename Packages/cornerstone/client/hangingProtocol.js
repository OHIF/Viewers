var hangingProtocol;

/**
 * This is an example of a hanging protocol
 * It takes in a set of studies, as well as the
 * number of rows and columns in the layout.
 *
 * It returns an array of objects, one for each viewport, detailing
 * which series should be loaded in the viewport.
 *
 * @param inputData
 * @returns {Array}
 */
function defaultHangingProtocol(inputData) {
    var studies = inputData.studies;
    var viewportRows = inputData.viewportRows;
    var viewportColumns = inputData.viewportColumns;

    if (!studies.length) {
        log.warn("No studies provided to Hanging Protocol");
        return;
    }

    // This is the most basic hanging protocol.
    var stacks = [];
    studies.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            
            // Ensure that the series has image data
            // (All images have rows)
            var anInstance = series.instances[0];
            if (!anInstance || !anInstance.rows) {
                return;
            }

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
