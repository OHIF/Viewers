import { OHIF } from 'meteor/ohif:core';

/**
 * Queries requested studies to get their metadata from PACS
 * @param studiesToQuery Studies to query
 */
queryStudies = function(studiesToQuery, options) {
    let studiesQueried = 0;
    const numberOfStudiesToQuery = studiesToQuery.length;
    const notify = (options || {}).notify || function() { /* noop */ };

    const promises = [];

    studiesToQuery.forEach(studyToQuery => {
        const promise = OHIF.studies.retrieveStudyMetadata(studyToQuery.studyInstanceUid);
        promise.then(study => {
            studiesQueried++;
            notify({
                total: numberOfStudiesToQuery,
                processed: studiesQueried
            });
        });
        promises.push(promise);
    });

    return Promise.all(promises);
};

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
                }).catch(error => {
                    OHIF.log.error('There was an error retrieving all studies metadeta.');
                    OHIF.log.error(error.stack);

                    OHIF.log.trace();
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
    let numberOFFilesToExport = 0;

    study.seriesList.forEach(function(series) {
        series.instances.forEach(function(instance) {
            if (instance.wadouri) {
                numberOFFilesToExport++;
            }
        });
    });

    return numberOFFilesToExport;
};
