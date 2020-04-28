import { httpErrorToStr, checkDicomFile } from '../utils/helpers';
import { api } from 'dicomweb-client';
import { errorHandler } from '@ohif/core';

class DicomUploadService {
  async smartUpload(files, url, uploadCallback, cancellationToken) {
    const CHUNK_SIZE = 1; // Only one file per request is supported so far
    const MAX_PARALLEL_JOBS = 50; // FIXME: tune MAX_PARALLEL_JOBS number

    let filesArray = Array.from(files);
    if (filesArray.length === 0) {
      throw new Error('No files were provided.');
    }

    let parallelJobsCount = Math.min(filesArray.length, MAX_PARALLEL_JOBS);
    let completed = false;

    const processJob = async (resolve, reject) => {
      while (filesArray.length > 0) {
        if (cancellationToken.get()) return;
        let chunk = filesArray.slice(0, CHUNK_SIZE);
        filesArray = filesArray.slice(CHUNK_SIZE);
        let error = null;
        try {
          if (chunk.length > 1) throw new Error('Not implemented');
          if (chunk.length === 1) await this.simpleUpload(chunk[0], url);
        } catch (err) {
          // It looks like a stupid bug of Babel that err is not an actual Exception object
          error = httpErrorToStr(err);
        }
        chunk.forEach(file => uploadCallback(file.fileId, error));
        if (!completed && filesArray.length === 0) {
          completed = true;
          resolve();
          return;
        }
      }
    };

    await new Promise(resolve => {
      for (let i = 0; i < parallelJobsCount; i++) {
        processJob(resolve);
      }
    });
  }

  async simpleUpload(file, url) {
    const client = this.getClient(url);
    const loadedFile = await this.readFile(file);
    const content = loadedFile.content;
    if (!checkDicomFile(content))
      throw new Error('This is not a valid DICOM file.');

    await client.storeInstances({ datasets: [content] });
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          content: reader.result,
        });
      };
      reader.onerror = error => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  setRetrieveAuthHeaderFunction(func) {
    this.retrieveAuthHeaderFunc = func;
  }

  getClient(url) {
    const headers = this.retrieveAuthHeaderFunc();
    const errorInterceptor = errorHandler.getHTTPErrorHandler();

    // TODO: a bit weird we are creating a new dicomweb client instance for every upload
    return new api.DICOMwebClient({
      url,
      headers,
    });
  }
}

export default new DicomUploadService();
