import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

import { PubSubService } from '@ohif/core';

export const EVENTS = {
  PROGRESS: 'event:DicomFileUploader:progress',
};

export interface DicomFileUploaderEvent {
  fileId: number;
}

export interface DicomFileUploaderProgressEvent extends DicomFileUploaderEvent {
  percentComplete: number;
}

export enum UploadStatus {
  NotStarted,
  InProgress,
  Success,
  Failed,
}

export default class DicomFileUploader extends PubSubService {
  private _file;
  private _fileId;
  private _dataSource;
  private _loadPromise;
  private _abortController = new AbortController();
  private _status: UploadStatus = UploadStatus.NotStarted;
  private _percentComplete = 0;

  constructor(file, dataSource) {
    super(EVENTS);
    this._file = file;
    this._fileId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    this._dataSource = dataSource;
  }

  getFileId(): string {
    return this._fileId;
  }

  getFileName(): string {
    return this._file.name;
  }

  getFileSize(): number {
    return this._file.size;
  }

  cancel(): void {
    this._abortController.abort();
  }

  getStatus(): UploadStatus {
    return this._status;
  }

  getPercentComplete(): number {
    return this._percentComplete;
  }

  async load(): Promise<void> {
    if (this._loadPromise) {
      // Already started loading, return the load promise.
      return this._loadPromise;
    }

    this._loadPromise = new Promise<void>((resolve, reject) => {
      // First try to load the file.
      cornerstoneWADOImageLoader.wadouri
        .loadFileRequest(this._fileId)
        .then(dicomFile => {
          if (!this._checkDicomFile(dicomFile)) {
            // The file is not DICOM
            this._reject(reject, new Error('Not a valid DICOM file.'));
            return;
          }

          // The upload listeners: fire progress events and/or settle the promise.
          const uploadCallbacks = {
            progress: evt => {
              if (!evt.lengthComputable) {
                // Progress computation is not possible.
                return;
              }

              this._status = UploadStatus.InProgress;

              this._percentComplete = Math.round(
                (100 * evt.loaded) / evt.total
              );
              this._broadcastEvent(EVENTS.PROGRESS, {
                fileId: this._fileId,
                percentComplete: this._percentComplete,
              });
            },
            timeout: () => {
              this._reject(reject, new Error('The request timed out.'));
            },
            abort: () => {
              this._reject(reject, new Error('The request was aborted.'));
            },
            error: () => {
              this._reject(reject, new Error('The request failed.'));
            },
          };

          // Do the actual upload by supplying the DICOM file and upload callbacks/listeners.
          return this._dataSource.store
            .dicom(dicomFile, uploadCallbacks, this._abortController.signal)
            .then(() => {
              this._status = UploadStatus.Success;
              resolve();
            })
            .catch(reason => {
              this._reject(reject, reason);
            });
        })
        .catch(reason => {
          this._reject(reject, reason);
        });
    });

    return this._loadPromise;
  }

  private _reject(reject: (reason?: any) => void, reason: any) {
    this._status = UploadStatus.Failed;
    reject(reason);
  }

  private _checkDicomFile(arrayBuffer: ArrayBuffer) {
    if (arrayBuffer.length <= 132) return false;
    const arr = new Uint8Array(arrayBuffer.slice(128, 132));
    // bytes from 128 to 132 must be "DICM"
    return Array.from('DICM').every((char, i) => char.charCodeAt(0) === arr[i]);
  }
}
