import { OHIF } from 'meteor/ohif:core';

/**
 * Queries requested studies to get their metadata from PACS
 * @param studiesToQuery Studies to query
 */
queryStudies = function(studiesToQuery, options) {
    const studiesQueried = [],
          numberOfStudiesToQuery = studiesToQuery.length,
          notify = (options || {}).notify || function() { /* noop */ }

    return new Promise((resolve, reject) => {
        if (studiesToQuery.length < 1) {
            return reject();
        }

        studiesToQuery.forEach(function(studyToQuery) {
            getStudyMetadata(studyToQuery.studyInstanceUid, function(study) {
                studiesQueried.push(study);

                notify({
                    total: numberOfStudiesToQuery,
                    processed: studiesQueried.length
                });

                if (studiesQueried.length === numberOfStudiesToQuery) {
                    resolve(studiesQueried);
                }
            });
        });
    });
}

queryStudiesWithProgress = function(studiesToQuery) {
    return OHIF.ui.showDialog('dialogProgress', {
        title: 'Querying Studies...',
        message: `Queried: 0 / ${studiesToQuery.length}`,
        total: studiesToQuery.length,
        task: {
            run: (dialog) => {
                queryStudies(studiesToQuery, {
                    notify: stats => {
                        dialog.update(stats.processed);
                        dialog.setMessage(`Queried: ${stats.processed} / ${stats.total}`);
                    }
                })
                .then(studiesQueried => {
                    dialog.done(studiesQueried);
                }, () => {
                    dialog.cancel();
                });
            }
        }
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
