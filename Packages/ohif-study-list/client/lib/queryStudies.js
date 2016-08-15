/**
 * Queries requested studies to get their metadata from PACS
 * @param studiesToQuery Studies to query
 * @param doneCallback Callback to call when the query is done
 */
queryStudies = function(studiesToQuery, doneCallback) {
    if (studiesToQuery.length < 1) {
        return;
    }

    var studiesQueried = [];
    var numberOfStudiesToQuery = studiesToQuery.length;

    progressDialog.show("Querying Studies...", numberOfStudiesToQuery);

    studiesToQuery.forEach(function(studyToQuery) {
        getStudyMetadata(studyToQuery.studyInstanceUid, function(study) {
            studiesQueried.push(study);

            var numberOfStudiesQueried = studiesQueried.length;

            progressDialog.update(numberOfStudiesQueried);

            if (numberOfStudiesQueried === numberOfStudiesToQuery) {
                doneCallback(studiesQueried);
            }
        });
    });
};

/**
 * Returns the total number of dicom files in a study
 * @param study Queried study (includes metadata)
 * @returns {number}
 */
getNumberOfFilesInStudy = function(study) {
    var numberOFFilesToExport = 0;

    study.seriesList.forEach(function(series) {
        series.instances.forEach(function(instance) {
            if (instance.wadouri) {
                numberOFFilesToExport++;
            }
        });
    });

    return numberOFFilesToExport;
};