import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

const fs = Npm.require('fs');
const fiber = Npm.require('fibers');

WebApp.connectHandlers.use('/uploadFilesToImport', function(req, res) {
    if (!req.headers.filename) {
        //  Response: BAD REQUEST (400)
        res.statusCode = 400;
        res.end();
    }

    //  Store files in temp location (they will be deleted when their import operations are completed)
    const dicomDir = '/tmp/dicomDir';
    createFolderIfNotExist(dicomDir);

    const fullFileName = dicomDir + '/' + req.headers.filename;
    const file = fs.createWriteStream(fullFileName);

    file.on('error', function(error) {
        OHIF.log.warn(error);
        //  Response: INTERNAL SERVER ERROR (500)
        res.statusCode = 400;
        res.end();
    });
    file.on('finish', function() {
        //  Response: SUCCESS (200)
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(fullFileName);
    });

    //  Pipe the request to the file
    req.pipe(file);
});

Meteor.methods({
    /**
     * Returns true if import is supported for default service type
     * @returns {boolean}
     */
    importSupported: function() {
        const server = OHIF.servers.getCurrentServer();
        if (server && server.type === 'dimse') {
            return true;
        }
    },
    /**
     * Imports studies from local into study list
     * @param studiesToImport Studies to import
     * @param studyImportStatusId Study import status collection id to track import status
     */
    importStudies: function(studiesToImport, studyImportStatusId) {
        if (!studiesToImport || !studyImportStatusId) {
            return;
        }

        const server = OHIF.servers.getCurrentServer();

        if (!server) {
            throw 'No properly configured server was available over DICOMWeb or DIMSE.';
        }

        if (server.type === 'dicomWeb') {
            //TODO: Support importing studies into dicomWeb
            OHIF.log.warn('Importing studies into dicomWeb is currently not supported.');
        } else if (server.type === 'dimse') {
            importStudiesDIMSE(studiesToImport, studyImportStatusId);
        }
    },
    /**
     * Create a new study import status item and insert it into the collection to track import status
     * @returns {studyImportStatusId: string}
     */
    createStudyImportStatus: function() {
        const studyImportStatus = {
            numberOfStudiesImported: 0,
            numberOfStudiesFailed: 0
        };
        return OHIF.studylist.collections.StudyImportStatus.insert(studyImportStatus);
    },
    /**
     * Remove the study import status item from the collection
     * @param id Collection id of the study import status in the collection
     */
    removeStudyImportStatus: function(id) {
        OHIF.studylist.collections.StudyImportStatus.remove(id);
    }
});

function importStudiesDIMSE(studiesToImport, studyImportStatusId) {
    if (!studiesToImport || !studyImportStatusId) {
        return;
    }
    //  Perform C-Store to import studies and handle the callbacks to update import status
    DIMSE.storeInstances(studiesToImport, function(err, file) {
        try {
            //  Use fiber to be able to modify meteor collection in callback
            fiber(function() {
                try {
                    //  Update the import status
                    if (err) {
                        OHIF.studylist.collections.StudyImportStatus.update(
                            { _id: studyImportStatusId },
                            { $inc: { numberOfStudiesFailed: 1 } }
                        );
                        OHIF.log.warn('Failed to import study via DIMSE: ', file, err);
                    } else {
                        OHIF.studylist.collections.StudyImportStatus.update(
                            { _id: studyImportStatusId },
                            { $inc: { numberOfStudiesImported: 1 } }
                        );
                        OHIF.log.info('Study successfully imported via DIMSE: ', file);
                    }

                } catch(error) {
                    OHIF.studylist.collections.StudyImportStatus.update(
                        { _id: studyImportStatusId },
                        { $inc: { numberOfStudiesFailed: 1 } }
                    );
                    OHIF.log.warn('Failed to import study via DIMSE: ', file, error);
                } finally {
                    //  The import operation of this file is completed, so delete it if still exists
                    if (fileExists(file)) {
                        fs.unlink(file);
                    }
                }

            }).run();
        } catch(error) {
            OHIF.studylist.collections.StudyImportStatus.update(
                { _id: studyImportStatusId },
                { $inc: { numberOfStudiesFailed: 1 } }
            );
            OHIF.log.warn('Failed to import study via DIMSE: ', file, error);
        }

    });
}

function createFolderIfNotExist(folder) {
    const folderParts = folder.split('/');
    let folderPart = folderParts[0];
    for (let i = 1; i < folderParts.length; i++) {
        folderPart += '/' + folderParts[i];
        if (!folderExists(folderPart)) {
            fs.mkdirSync(folderPart);
        }
    }
}

function fileExists(folder) {
    try {
        return fs.statSync(folder).isFile();
    } catch (err) {
        return false;
    }
}

function folderExists(folder) {
    try {
        return fs.statSync(folder).isDirectory();
    } catch (err) {
        return false;
    }
}
