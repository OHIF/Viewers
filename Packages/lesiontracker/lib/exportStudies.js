/**
 * Exports requested studies
 * @param studiesToExport Studies to export
 */
exportStudies = function(studiesToExport) {
    var numberOfFilesToExport = getNumberOfFilesToExport(studiesToExport);

    progressDialog.show("Exporting Studies...", numberOfFilesToExport);

    try {
        exportStudiesInternal(studiesToExport, numberOfFilesToExport);
    } catch (err) {
        progressDialog.close();
        console.error("Failed to export studies: " + err.message);
    }
};

function exportStudiesInternal(studiesToExport, numberOfFilesToExport) {
    var zip = new JSZip();

    var exportFailed = false;
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
                xhr.responseType = "arraybuffer";

                //  Downloaded the dicom file completely
                xhr.onload = function() {
                    //  If failed to download a dicom file, skip others
                    if (exportFailed) {
                        return;
                    }

                    var responseArrayBuffer = xhr.response;
                    if (responseArrayBuffer) {
                        seriesFolder.file(instance.sopInstanceUid + ".dcm", responseArrayBuffer, { binary: true });
                    }

                    numberOfFilesExported++;

                    if (numberOfFilesExported === numberOfFilesToExport) {
                        var zipContent = zip.generate({ type: "blob" });
                        saveAs(zipContent, "studies.zip");
                    }

                    progressDialog.update(numberOfFilesExported);
                };

                //  Failed to download the dicom file
                xhr.onerror = function() {
                    exportFailed = true;

                    progressDialog.close();
                    console.error("Failed to export studies!");
                };

                xhr.send(null);
            });
        });
    });
}

function getNumberOfFilesToExport(studiesToExport) {
    var numberOFFilesToExport = 0;

    studiesToExport.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            series.instances.forEach(function(instance) {
                if (instance.wadouri) {
                    numberOFFilesToExport++;
                }
            });
        });
    });

    return numberOFFilesToExport;
}
