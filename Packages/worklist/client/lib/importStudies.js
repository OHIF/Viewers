/**
 * Imports selected studies from local into worklist
 * @param filesToImport Files located in the client machine to import
 */
importStudies = function(filesToImport, importCallback) {
    if (filesToImport.length < 1) {
        return;
    }
    var fileUploadStatus = {
        numberOfFilesUploaded: 0,
        numberOfFilesFailed: 0
    };
    var numberOfFilesToUpload = filesToImport.length;
    var studiesToImport = [];
    progressDialog.show({
        title: "Uploading Files...",
        numberOfCompleted: 0,
        numberOfTotal: numberOfFilesToUpload
    });

    //  Upload files to the server
    filesToImport.forEach(function(fileToUpload) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "/uploadFilesToImport", true);
        xhr.setRequestHeader("filename", fileToUpload.name);

        xhr.onload = function() {
            //  Failed to upload a file
            if (xhr.readyState === 4 && xhr.status !== 200) {
                updateFileUploadStatus(fileUploadStatus, false);
                return;
            }

            studiesToImport.push(xhr.responseText);

            updateFileUploadStatus(fileUploadStatus, true);

            var numberOfFilesProcessedToUpload = fileUploadStatus.numberOfFilesUploaded + fileUploadStatus.numberOfFilesFailed;
            progressDialog.update(numberOfFilesProcessedToUpload);

            if (numberOfFilesToUpload === numberOfFilesProcessedToUpload) {
                //  The upload is completed, so import files
                importStudiesInternal(studiesToImport, importCallback);

                if (fileUploadStatus.numberOfFilesFailed > 0) {
                    //TODO: Some files failed to upload, so let user know
                    log.info("Failed to upload " + fileUploadStatus.numberOfFilesFailed + " of " + numberOfFilesToUpload + " files");
                }
            }
        };

        //  Failed to upload a file
        xhr.onerror = function() {
            updateFileUploadStatus(fileUploadStatus, false);
        };

        xhr.send(fileToUpload);
    });
};

function updateFileUploadStatus(fileUploadStatus, isSuccess) {
    if (!isSuccess) {
        fileUploadStatus.numberOfFilesFailed++;
    } else {
        fileUploadStatus.numberOfFilesUploaded++;
    }
}
function importStudiesInternal(studiesToImport, importCallback) {
    if (!studiesToImport) {
        return;
    }

    var numberOfStudiesToImport = studiesToImport.length;

    progressDialog.show({
        title: "Importing Studies...",
        numberOfCompleted: 0,
        numberOfTotal: numberOfStudiesToImport
    });

    //  Create/Insert a new study import status item
    Meteor.call("createStudyImportStatus", function(err, studyImportStatusId) {
        if (err) {
            // Hide dialog
            progressDialog.close();
            console.log(err.message);
            return;
        }

        //  Handle when StudyImportStatus collection is updated
        StudyImportStatus.find(studyImportStatusId).observe({
            changed: function(studyImportStatus) {
                if (!studyImportStatus) {
                    return;
                }

                var numberOfStudiesProcessedToImport = studyImportStatus.numberOfStudiesImported + studyImportStatus.numberOfStudiesFailed;

                // Show number of imported files
                var successMessage = 'Imported '+studyImportStatus.numberOfStudiesImported+' of '+numberOfStudiesToImport;
                progressDialog.setMessage({
                    message: successMessage,
                    messageType: 'success'
                });
                progressDialog.update(numberOfStudiesProcessedToImport);

                // Show number of failed files if there is at least one failed file
                if (studyImportStatus.numberOfStudiesFailed > 0) {
                    var successMessage = 'Failed '+studyImportStatus.numberOfStudiesFailed+' of '+numberOfStudiesToImport;
                    progressDialog.setMessage({
                        message: successMessage,
                        messageType: 'warning'
                    });
                }

                if (numberOfStudiesProcessedToImport == numberOfStudiesToImport) {
                    //  The entire import operation is completed, so remove the study import status item
                    Meteor.call("removeStudyImportStatus", studyImportStatus._id);

                    //  Let the caller know that import operation is completed
                    if (importCallback) {
                        importCallback();
                    }
                }
            }
        });

        //  Import studies with study import status id to get callbacks
        Meteor.call("importStudies", studiesToImport, studyImportStatusId);
    });
}