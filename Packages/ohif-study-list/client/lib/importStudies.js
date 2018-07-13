import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

/**
 * Imports selected studies from local into studylist
 * @param filesToImport Files located in the client machine to import
 */
OHIF.studylist.importStudies = filesToImport => {
    const numberOfFiles = filesToImport && filesToImport.length;
    if (!numberOfFiles) {
        return new Promise((resolve, reject) => reject('No files to upload'));
    }

    const uploadMessage = msg => (typeof msg === 'undefined') ? '' : `Uploaded files: ${msg.processed} / ${msg.total}`;

    const taskRunHandler = dialog => {
        const uploadErrorHandler = fileNames => {
            const names = fileNames.join('; ');
            dialog.setMessage(`Failed to upload files: ${names}`);
        };

        const uploadSuccessHandler = studiesToImport => {
            importStudiesInternal(studiesToImport, dialog).then(() => {
                dialog.done();
            }).catch(errorMessage => {
                dialog.setMessage(errorMessage);
            });
        };

        uploadFiles(filesToImport, dialog).then(uploadSuccessHandler).catch(uploadErrorHandler);
    };

    return OHIF.ui.showDialog('dialogProgress', {
        title: 'Importing Studies...',
        message: uploadMessage,
        total: numberOfFiles,
        task: { run: taskRunHandler }
    });
};

const uploadFiles = (files, dialog) => {
    let processed = 0;

    const promise = new Promise((resolve, reject) => {
        const promises = [];

        //  Upload files to the server
        files.forEach(file => {
            const filePromise = uploadFile(file, dialog);
            filePromise.then(() => dialog.update(++processed));
            promises.push(filePromise);
        });

        Promise.all(promises).then(resolve).catch(reject);
    });

    return promise;
};

const uploadFile = file => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/uploadFilesToImport', true);
        xhr.setRequestHeader('filename', file.name);

        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status !== 200) {
                // Failed to upload the file
                reject(file.name);
            } else {
                // Success uploading the file
                resolve(xhr.responseText);
            }
        };

        // Failed to upload the file
        xhr.onerror = () => reject(file.name);

        xhr.send(file);
    });
};

const importStudiesInternal = (studiesToImport, dialog) => {
    const numberOfStudies = studiesToImport && studiesToImport.length;
    if (!numberOfStudies) {
        return new Promise((resolve, reject) => reject('No studies to import'));
    }

    let processed = 0;
    dialog.update(processed);
    dialog.setTotal(numberOfStudies);
    dialog.setMessage(({ processed, total }) => `Imported: ${processed} / ${total}`);

    return new Promise((resolve, reject) => {
        //  Create/Insert a new study import status item
        Meteor.call('createStudyImportStatus', (error, studyImportStatusId) => {
            if (error) {
                return reject(error.message);
            }

            //  Handle when StudyImportStatus collection is updated
            OHIF.studylist.collections.StudyImportStatus.find(studyImportStatusId).observe({
                changed(studyImportStatus) {
                    const { numberOfStudiesImported, numberOfStudiesFailed } = studyImportStatus;
                    dialog.update(numberOfStudiesImported);

                    if ((numberOfStudiesImported + numberOfStudiesFailed) === numberOfStudies) {
                        //  The entire import operation is completed, so remove the study import status item
                        Meteor.call('removeStudyImportStatus', studyImportStatus._id);

                        // Show number of failed files if there is at least one failed file
                        if (studyImportStatus.numberOfStudiesFailed > 0) {
                            const failed = numberOfStudiesFailed;
                            reject(`Failed to import ${failed} of ${numberOfStudies} studies`);
                        } else {
                            resolve();
                        }
                    }
                }
            });

            //  Import studies with study import status id to get callbacks
            Meteor.call('importStudies', studiesToImport, studyImportStatusId);
        });
    });
};
