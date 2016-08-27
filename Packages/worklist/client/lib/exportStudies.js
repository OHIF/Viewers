var exportFailed;

/**
 * Exports requested studies
 * @param studiesToExport Studies to export
 */
exportStudies = function(studiesToExport) {
    if (studiesToExport.length < 1) {
        return;
    }

    queryStudies(studiesToExport, exportQueriedStudies);
};

function exportQueriedStudies(studiesToExport) {
    var numberOfFilesToExport = 0;
    studiesToExport.forEach(function(study) {
        numberOfFilesToExport += getNumberOfFilesInStudy(study);
    });

    progressDialog.show("Exporting Studies...", numberOfFilesToExport);

    try {
        exportQueriedStudiesInternal(studiesToExport, numberOfFilesToExport);
    } catch (err) {
        progressDialog.close();
        console.error("Failed to export studies: " + err.message);
    }
}

function exportQueriedStudiesInternal(studiesToExport, numberOfFilesToExport) {
    var zip = new JSZip();

    exportFailed = false;
    var numberOfFilesExported = 0;

    studiesToExport.forEach(function(study) {
        sortStudy(study);

        var studyFolder = zip.folder(study.studyInstanceUid);

        study.seriesList.forEach(function(series) {
            var seriesFolder = studyFolder.folder(series.seriesInstanceUid);

            series.instances.forEach(function(instance) {
                if (!instance.wadouri) {
                    return;
                }

                //  If failed to download a dicom file, skip others
                if (exportFailed) {
                    return;
                }

                //  Download and Zip the dicom file
                var xhr = new XMLHttpRequest();
                xhr.open("GET", instance.wadouri, true);
                xhr.responseType = "blob";

                //  Downloaded the dicom file completely
                xhr.onload = function(e) {
                    //  If failed to download a dicom file, skip others
                    if (exportFailed) {
                        return;
                    }

                    //  Failed to export a file
                    if (xhr.readyState === 4 && xhr.status !== 200) {
                        onExportFailed("File not downloaded: " + instance.wadouri);
                        return;
                    }

                    var blobFile = new Blob([xhr.response], {type: 'application/dicom'});

                    var fileReader = new FileReader();

                    fileReader.onload = function() {
                        try {
                            seriesFolder.file(instance.sopInstanceUid + ".dcm", fileReader.result, { binary: true });
                        } catch(err) {
                            onExportFailed(err.message);
                            return;
                        }

                        numberOfFilesExported++;

                        if (numberOfFilesExported === numberOfFilesToExport) {
                            var zipContent = zip.generate({ type: "blob" });
                            saveAs(zipContent, "studies.zip");
                        }

                        progressDialog.update(numberOfFilesExported);
                    };

                    fileReader.readAsArrayBuffer(blobFile);
                };

                //  Failed to download the dicom file
                xhr.onerror = function() {
                    onExportFailed("File not downloaded: " + instance.wadouri);
                };

                xhr.send();
            });
        });
    });
}

function onExportFailed(err) {
    exportFailed = true;
    progressDialog.close();

    //TODO: Export failed and dialog closed, so let user know
    console.error("Failed to export studies!", err);
}
