import { StudyImportStatus } from '../../both/collections';

var fs = Npm.require('fs');
var fiber = Npm.require('fibers');

WebApp.connectHandlers.use('/uploadFilesToImport', function(req, res) {
    if (!req.headers.filename) {
        //  Response: BAD REQUEST (400)
        res.statusCode = 400;
        res.end();
    }

    //  Store files in temp location (they will be deleted when their import operations are completed)
    var dicomDir = '/tmp/dicomDir';
    createFolderIfNotExist(dicomDir);

    var fullFileName = dicomDir + '/' + req.headers.filename;
    var file = fs.createWriteStream(fullFileName);

    file.on('error',function(error){
        console.log(error);
        //  Response: INTERNAL SERVER ERROR (500)
        res.statusCode = 400;
        res.end();
    });
    file.on('finish',function(){
        //  Response: SUCCESS (200)
        res.writeHead(200, {'Content-Type': 'text/plain'});
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
        if (Meteor.settings.servers.dimse && Meteor.settings.defaultServiceType === 'dimse') {
            return true;
        }
    },
    /**
     * Imports studies from local into worklist
     * @param studiesToImport Studies to import
     * @param studyImportStatusId Study import status collection id to track import status
     */
    importStudies: function(studiesToImport, studyImportStatusId) {
        if (!studiesToImport || !studyImportStatusId) {
            return;
        }

        if (Meteor.settings.servers.dicomWeb && Meteor.settings.defaultServiceType === 'dicomWeb') {
            //TODO: Support importing studies into dicomWeb
            console.log('Importing studies into dicomWeb is currently not supported.');
        } else if (Meteor.settings.servers.dimse && Meteor.settings.defaultServiceType === 'dimse') {
            importStudiesDIMSE(studiesToImport, studyImportStatusId);
        } else {
            throw 'No properly configured server was available over DICOMWeb or DIMSE.';
        }
    },
    /**
     * Create a new study import status item and insert it into the collection to track import status
     * @returns {studyImportStatusId: string}
     */
    createStudyImportStatus: function() {
        var studyImportStatus = { numberOfStudiesImported: 0, numberOfStudiesFailed: 0 };
        return StudyImportStatus.insert(studyImportStatus);
    },
    /**
     * Remove the study import status item from the collection
     * @param id Collection id of the study import status in the collection
     */
    removeStudyImportStatus: function(id) {
        StudyImportStatus.remove(id);
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
                        StudyImportStatus.update({_id: studyImportStatusId}, {$inc: {'numberOfStudiesFailed': 1}});
                        console.log("Failed to import study via DIMSE: ", file, err);
                    } else {
                        StudyImportStatus.update({_id: studyImportStatusId}, {$inc: {'numberOfStudiesImported': 1}});
                        console.log("Study successfully imported via DIMSE: ", file);
                    }

                } catch(error) {

                    StudyImportStatus.update({_id: studyImportStatusId}, {$inc: {'numberOfStudiesFailed': 1}});
                    console.log("Failed to import study via DIMSE: ", file, error);
                } finally {
                    //  The import operation of this file is completed, so delete it if still exists
                    if (fileExists(file)) {
                        fs.unlink(file);
                    }
                }

            }).run();
        } catch(error) {
            StudyImportStatus.update({_id: studyImportStatusId}, {$inc: {'numberOfStudiesFailed': 1}});
            console.log("Failed to import study via DIMSE: ", file, error);
        }

    });
}

function createFolderIfNotExist(folder) {
    var folderParts = folder.split('/');
    var folderPart = folderParts[0];
    for (var i = 1; i < folderParts.length; i++) {
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
