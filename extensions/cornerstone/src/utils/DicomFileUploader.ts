import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

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
  Cancelled,
}

type CancelOrFailed = UploadStatus.Cancelled | UploadStatus.Failed;

export class UploadRejection {
  message: string;
  status: CancelOrFailed;

  constructor(status: CancelOrFailed, message: string) {
    this.message = message;
    this.status = status;
  }
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
    this._fileId = dicomImageLoader.wadouri.fileManager.add(file);
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
      // The upload listeners: fire progress events and/or settle the promise.
      const uploadCallbacks = {
        progress: evt => {
          if (!evt.lengthComputable) {
            // Progress computation is not possible.
            return;
          }

          this._status = UploadStatus.InProgress;

          this._percentComplete = Math.round((100 * evt.loaded) / evt.total);
          this._broadcastEvent(EVENTS.PROGRESS, {
            fileId: this._fileId,
            percentComplete: this._percentComplete,
          });
        },
        timeout: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'The request timed out.'));
        },
        abort: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Cancelled, 'Cancelled'));
        },
        error: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'The request failed.'));
        },
      };

      // First try to load the file.
      dicomImageLoader.wadouri
        .loadFileRequest(this._fileId)
        .then(dicomFile => {
          if (this._abortController.signal.aborted) {
            this._reject(reject, new UploadRejection(UploadStatus.Cancelled, 'Cancelled'));
            return;
          }

          if (!this._checkDicomFile(dicomFile)) {
            // The file is not DICOM
            this._reject(
              reject,
              new UploadRejection(UploadStatus.Failed, 'Not a valid DICOM file.')
            );
            return;
          }

          const request = new XMLHttpRequest();
          this._addRequestCallbacks(request, uploadCallbacks);

          // Do the actual upload by supplying the DICOM file and upload callbacks/listeners.
          return this._dataSource.store
            .dicom(dicomFile, request)
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

  private _isRejected(): boolean {
    return this._status === UploadStatus.Failed || this._status === UploadStatus.Cancelled;
  }

  private _reject(reject: (reason?: any) => void, reason: any) {
    if (this._isRejected()) {
      return;
    }

    if (reason instanceof UploadRejection) {
      this._status = reason.status;
      reject(reason);
      return;
    }

    this._status = UploadStatus.Failed;

    if (reason.message) {
      reject(new UploadRejection(UploadStatus.Failed, reason.message));
      return;
    }

    reject(new UploadRejection(UploadStatus.Failed, reason));
  }

  private _addRequestCallbacks(request: XMLHttpRequest, uploadCallbacks) {
    const abortCallback = () => request.abort();
    this._abortController.signal.addEventListener('abort', abortCallback);

    for (const [eventName, callback] of Object.entries(uploadCallbacks)) {
      request.upload.addEventListener(eventName, callback);
    }

    const cleanUpCallback = () => {
      this._abortController.signal.removeEventListener('abort', abortCallback);

      for (const [eventName, callback] of Object.entries(uploadCallbacks)) {
        request.upload.removeEventListener(eventName, callback);
      }

      request.removeEventListener('loadend', cleanUpCallback);
    };
    request.addEventListener('loadend', cleanUpCallback);
  }

  private _checkDicomFile(arrayBuffer: ArrayBuffer) {
    if (arrayBuffer.length <= 132) {
      return false;
    }
    const arr = new Uint8Array(arrayBuffer.slice(128, 132));
    // bytes from 128 to 132 must be "DICM"
    return Array.from('DICM').every((char, i) => char.charCodeAt(0) === arr[i]);
  }
}
