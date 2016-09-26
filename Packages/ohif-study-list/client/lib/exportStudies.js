import { JSZip } from 'meteor/silentcicero:jszip';
import { OHIF } from 'meteor/ohif:core';

let exportFailed;

/**
 * Exports requested studies
 * @param studiesToExport Studies to export
 */
OHIF.studylist.exportStudies = studiesToExport => {
    if (studiesToExport.length < 1) {
        return;
    }

    queryStudies(studiesToExport, exportQueriedStudies);
};

const exportQueriedStudies = studiesToExport => {
    let numberOfFilesToExport = 0;
    studiesToExport.forEach(study => {
        numberOfFilesToExport += getNumberOfFilesInStudy(study);
    });

    OHIF.studylist.progressDialog.show('Exporting Studies...', numberOfFilesToExport);

    try {
        exportQueriedStudiesInternal(studiesToExport, numberOfFilesToExport);
    } catch (err) {
        OHIF.studylist.progressDialog.close();
        OHIF.log.error(`Failed to export studies: ${err.message}`);
    }
};

const exportQueriedStudiesInternal = (studiesToExport, numberOfFilesToExport) => {
    const zip = new JSZip();

    exportFailed = false;
    let numberOfFilesExported = 0;

    const onExportFailed = err => {
        exportFailed = true;
        OHIF.studylist.progressDialog.close();

        //TODO: Export failed and dialog closed, so let user know
        OHIF.log.error('Failed to export studies!', err);
    };

    studiesToExport.forEach(study => {
        sortStudy(study);

        const studyFolder = zip.folder(study.studyInstanceUid);

        study.seriesList.forEach(series => {
            const seriesFolder = studyFolder.folder(series.seriesInstanceUid);

            series.instances.forEach(instance => {
                if (!instance.wadouri) {
                    return;
                }

                //  If failed to download a dicom file, skip others
                if (exportFailed) {
                    return;
                }

                //  Download and Zip the dicom file
                const xhr = new XMLHttpRequest();
                xhr.open('GET', instance.wadouri, true);
                xhr.responseType = 'blob';

                //  Downloaded the dicom file completely
                xhr.onload = () => {
                    //  If failed to download a dicom file, skip others
                    if (exportFailed) {
                        return;
                    }

                    //  Failed to export a file
                    if (xhr.readyState === 4 && xhr.status !== 200) {
                        onExportFailed(`File not downloaded: ${instance.wadouri}`);
                        return;
                    }

                    const blobFile = new Blob([xhr.response], { type: 'application/dicom' });

                    const fileReader = new FileReader();

                    fileReader.onload = () => {
                        try {
                            seriesFolder.file(`${instance.sopInstanceUid}.dcm`, fileReader.result, { binary: true });
                        } catch(err) {
                            onExportFailed(err.message);
                            return;
                        }

                        numberOfFilesExported++;

                        if (numberOfFilesExported === numberOfFilesToExport) {
                            const zipContent = zip.generate({ type: 'blob' });
                            saveAs(zipContent, 'studies.zip');
                        }

                        OHIF.studylist.progressDialog.update(numberOfFilesExported);
                    };

                    fileReader.readAsArrayBuffer(blobFile);
                };

                //  Failed to download the dicom file
                xhr.onerror = () => onExportFailed(`File not downloaded: ${instance.wadouri}`);

                xhr.send();
            });
        });
    });
};
