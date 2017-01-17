import { JSZip } from 'meteor/silentcicero:jszip';
import { OHIF } from 'meteor/ohif:core';

const getNumberOfFilesToExport = function(studiesToExport) {
    let numberOfFilesToExport = 0;

    studiesToExport.forEach(study => {
        numberOfFilesToExport += getNumberOfFilesInStudy(study);
    });

    return numberOfFilesToExport;
}

const convertSizeToString = size => {
    const measuments = ['B', 'KB', 'MB', 'GB'];
    let totalBytes = size,
        measumentIndex = 0;

    while(totalBytes > 1024) {
        totalBytes /= 1024;
        measumentIndex++;
    }

    return `${totalBytes.toFixed(2)} ${measuments[measumentIndex]}`;
}

/**
 * Exports requested studies
 * @param studiesToExport Studies to export
 */
OHIF.studylist.exportStudies = studiesToExport => {
    if (studiesToExport.length < 1) {
        return;
    }

    queryStudiesWithProgress(studiesToExport)
    .then(exportQueriedStudiesWithProgress);
};

const exportQueriedStudiesWithProgress = studiesToExport => {
    const exportFilesCount = getNumberOfFilesToExport(studiesToExport);
    let exportHandler;

    return OHIF.ui.showDialog('dialogProgress', {
        title: 'Exporting Studies...',
        message: `Exported files: 0 / ${exportFilesCount}`,
        total: getNumberOfFilesToExport(studiesToExport),
        task: {
            run: (dialog) => {
                exportHandler = exportQueriedStudies(studiesToExport, {
                    notify: stats => {
                        const fileSize = convertSizeToString(stats.totalBytes);

                        dialog.update(stats.processed);
                        dialog.setMessage(`Exported files: ${stats.processed} / ${stats.total} (${fileSize})`);
                    }
                });

                exportHandler.promise.then(() => {
                    dialog.done();
                }, () => {
                    dialog.setMessage('Failed to export studies');
                });
            }
        }
    }).then(null, err => {
        exportHandler.cancel();
    });
};

const exportQueriedStudies = (studiesToExport, options) => {
    const zip = new JSZip(),
          promises = [],
          pendingDownloads = [],
          exportFilesCount = getNumberOfFilesToExport(studiesToExport),
          notify = (options || {}).notify || function() { /* noop */ };

    const cancelDownloads = () => {
        while(pendingDownloads.length) {
            const download = pendingDownloads.pop();
            download.cancel();
        }
    };

    let totalBytes = 0;

    studiesToExport.forEach(study => {
        study.seriesList.forEach(series => {
            series.instances.forEach(instance => {
                if (!instance.wadouri) {
                    return;
                }

                const download = downloadDicomFile(instance);
                pendingDownloads.push(download);

                const promise = download.promise
                .then(data => {
                    const downloadIndex = pendingDownloads.indexOf(download);

                    totalBytes += data && data.size ? data.size : 0;

                    if(downloadIndex > -1) {
                        pendingDownloads.splice(downloadIndex, 1);
                    }

                    notify({
                        total: exportFilesCount,
                        processed: exportFilesCount - pendingDownloads.length,
                        totalBytes: totalBytes
                    })
                    
                    return zipInstance(study, series, instance, zip, data)
                })
                .catch(err => {
                    if(!(err instanceof ExportStudyDownloadCanceledError)) {
                        OHIF.log.error('Failed to export studies', err);
                    }

                    cancelDownloads();
                    throw err;
                });

                promises.push(promise);
            });
        });
    });

    return {
        cancel: cancelDownloads,
        promise: Promise.all(promises).then(() => {
            const zipContent = zip.generate({ type: 'blob' });
            saveAs(zipContent, 'studies.zip');
        })
    }
};

const downloadDicomFile = instance => {
    let xhr,
        promiseReject;

    const promise = new Promise((resolve, reject) => {
        promiseReject = reject;

        xhr = new XMLHttpRequest();
        xhr.open('GET', instance.wadouri, true);
        xhr.responseType = 'blob';

        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status !== 200) {
                return reject(new Error(`File not downloaded: ${instance.wadouri}`));
            }

            resolve(xhr.response)
        };

        xhr.onerror = () => {
            reject(new Error(`File not downloaded: ${instance.wadouri}`));
        };

        xhr.send();
    });

    return {
        promise: promise,
        cancel: () => {
            xhr.abort();
            promiseReject(new ExportStudyDownloadCanceledError('Download canceled'));
        }
    }
};


const zipInstance = (study, series, instance, zip, data) => {
    const fileReader = new FileReader(),
          blobFile = new Blob([data], { type: 'application/dicom' }),
          zipFolder = zip.folder(study.studyInstanceUid).folder(series.seriesInstanceUid);

    const promise = new Promise((resolve, reject) => {
        fileReader.onload = () => {
            try {
                zipFolder.file(`${instance.sopInstanceUid}.dcm`, fileReader.result, { binary: true });
                resolve()
            } catch(err) {
                reject(err);
            }
        };
    });

    fileReader.readAsArrayBuffer(blobFile);

    return promise;
};


const ExportStudyDownloadCanceledError = (message) => {
  this.name = 'ExportStudyDownloadCanceledError';
  this.message = message || 'Download canceled';
  this.stack = (new Error()).stack;
}
ExportStudyDownloadCanceledError.prototype = Object.create(Error.prototype);
ExportStudyDownloadCanceledError.prototype.constructor = ExportStudyDownloadCanceledError;
