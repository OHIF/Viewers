/**
 * Imports selected studies from local into worklist
 * @param filesToImport Files located in the client machine to import
 */
importStudies = function(filesToImport, importCallback) {
    if (filesToImport.length < 1) {
        return;
    }
    var fileUploadStatus = { numberOfFilesUploaded: 0, numberOfFilesFailed: 0 };

    var numberOfFilesToUpload = filesToImport.length;
    var studiesToImport = [];

    progressDialog.show("Uploading Files...", numberOfFilesToUpload);

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
                    console.log("Failed to upload " + fileUploadStatus.numberOfFilesFailed + " of " + numberOfFilesToUpload + " files");
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
    var numberOfStudiesToImport = studiesToImport.length;

    progressDialog.show("Importing Studies...", numberOfStudiesToImport);

    //  Create/Insert a new study import status item
    Meteor.call("createStudyImportStatus", function(err, studyImportStatusId) {
        if (err) {
            console.log(err);
            return;
        }

        //  Handle when it is updated
        StudyImportStatus.find(studyImportStatusId).observe({
            changed: function(studyImportStatus) {
                if (!studyImportStatus) {
                    return;
                }

                var numberOfStudiesProcessedToImport = studyImportStatus.numberOfStudiesImported + studyImportStatus.numberOfStudiesFailed;

                progressDialog.update(numberOfStudiesProcessedToImport);

                if (numberOfStudiesProcessedToImport == numberOfStudiesToImport) {
                    //  The entire import operation is completed, so remove the study import status item
                    Meteor.call("removeStudyImportStatus", studyImportStatus._id);

                    if (studyImportStatus.numberOfStudiesFailed > 0) {
                        //TODO: Some files failed to import, so let user know
                        console.log("Failed to import " + studyImportStatus.numberOfStudiesFailed + " of " + numberOfStudiesToImport + " files");
                    }

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