import { DicomMetadataStore, IWebApiDataSource, utils } from '@ohif/core';
import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';
import { unzipSync } from 'fflate';
import { registerNaturalizedDatasetsForLocalWadouri } from '../utils/registerNaturalizedDatasetForLocalWadouri';
import { datasetToDicomBlob } from '../utils/dicomWriter';
import { appendFrameQueryToImageId } from '../utils/appendFrameQueryToImageId';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

const metadataProvider = OHIF.classes.MetadataProvider;
const { EVENTS } = DicomMetadataStore;
const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;

const END_MODALITIES = {
  SR: true,
  SEG: true,
  DOC: true,
};

const compareValue = (v1, v2, def = 0) => {
  if (v1 === v2) return def;
  if (v1 < v2) return -1;
  return 1;
};

const customSort = (seriesA, seriesB) => {
  const instanceA = seriesA.instances[0];
  const instanceB = seriesB.instances[0];
  const modalityA = instanceA.Modality;
  const modalityB = instanceB.Modality;

  const isEndA = END_MODALITIES[modalityA];
  const isEndB = END_MODALITIES[modalityB];

  if (isEndA && isEndB) {
    return compareValue(instanceA.SeriesNumber, instanceB.SeriesNumber);
  }
  if (!isEndA && !isEndB) {
    return compareValue(instanceB.SeriesNumber, instanceA.SeriesNumber);
  }
  return isEndA ? -1 : 1;
};

interface StudyMetadataEntry {
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  date?: string;
  time?: string;
  description?: string;
  modalities?: string;
  accession?: string;
  instances?: number;
  zipUrl: string;
}

interface DicomZipConfig {
  name: string;
  friendlyName?: string;
  parentOrigin?: string;
}

function createDicomZipApi(dicomZipConfig: DicomZipConfig, servicesManager, extensionManager?) {
  const { uiNotificationService } = servicesManager.services;

  let _studiesMetadata: StudyMetadataEntry[] = [];
  let _zipUrlMap: Map<string, string> = new Map();
  let _initialStudyInstanceUIDs: string[] | null = null;
  const _loadingStudies: Set<string> = new Set();

  const STORAGE_KEY = 'chavi-studies';

  function _applyMetadata(studies, studyInstanceUIDs?) {
    _studiesMetadata = studies || [];
    _initialStudyInstanceUIDs = studyInstanceUIDs || null;
    _zipUrlMap = new Map(_studiesMetadata.map(s => [s.studyInstanceUid, s.zipUrl]));
    _saveToLocalStorage();

    // If on the viewer page, navigate to study list so new metadata is visible.
    // DataSourceWrapper (which listens for ACTIVE_DATA_SOURCE_CHANGED) is only
    // mounted on the study list route, not on /viewer.
    if (window.location.pathname.startsWith('/viewer')) {
      window.location.href = '/';
      return;
    }

    // Trigger study list refresh via extensionManager pub/sub,
    // which DataSourceWrapper already listens to.
    if (extensionManager?.EVENTS?.ACTIVE_DATA_SOURCE_CHANGED) {
      extensionManager._broadcastEvent(
        extensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
        extensionManager.getActiveDataSourceDefinition?.()
      );
    }
  }

  function _saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_studiesMetadata));
    } catch {
      // localStorage might be full or unavailable; non-critical
    }
  }

  function _loadFromLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return false;
      _studiesMetadata = parsed;
      _zipUrlMap = new Map(_studiesMetadata.map(s => [s.studyInstanceUid, s.zipUrl]));
      return true;
    } catch {
      return false;
    }
  }

  function _hasParentWindow(): boolean {
    try {
      return window.parent !== window || window.opener !== null;
    } catch {
      return false;
    }
  }

  function _receiveMetadataViaPostMessage(): Promise<void> {
    return new Promise(resolve => {
      const parentOrigin = dicomZipConfig.parentOrigin || '*';
      const handleMessage = (event: MessageEvent) => {
        if (
          dicomZipConfig.parentOrigin &&
          dicomZipConfig.parentOrigin !== '*' &&
          event.origin !== dicomZipConfig.parentOrigin
        ) {
          return;
        }

        const data = event.data;
        if (!data || data.type !== 'chavi-metadata') {
          return;
        }

        _applyMetadata(data.studies, data.studyInstanceUIDs);

        window.removeEventListener('message', handleMessage);
        clearTimeout(timeout);
        resolve();
      };

      window.addEventListener('message', handleMessage);

      const targetWindow = window.opener || window.parent;
      targetWindow.postMessage({ type: 'chavi-ready' }, parentOrigin);

      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve();
      }, 3000);
    });
  }

  // Persistent listener: handles chavi-metadata even after initialization,
  // so re-sending metadata to an already-open tab refreshes the study list.
  function _setupPersistentMetadataListener() {
    window.addEventListener('message', (event: MessageEvent) => {
      if (
        dicomZipConfig.parentOrigin &&
        dicomZipConfig.parentOrigin !== '*' &&
        event.origin !== dicomZipConfig.parentOrigin
      ) {
        return;
      }

      const data = event.data;
      if (!data || data.type !== 'chavi-metadata') {
        return;
      }

      _applyMetadata(data.studies, data.studyInstanceUIDs);
    });
  }

  async function _receiveMetadataViaUrl(query): Promise<void> {
    const metadataUrl = query.getAll('metadataUrl')[0];
    if (!metadataUrl) {
      return;
    }

    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const studies = Array.isArray(data) ? data : data.studies || [];
    const studyInstanceUIDs = query.getAll('StudyInstanceUIDs').length
      ? query.getAll('StudyInstanceUIDs')
      : null;
    _applyMetadata(studies, studyInstanceUIDs);
  }

  async function _downloadAndUnzip(zipUrl: string): Promise<Record<string, Uint8Array>> {
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error(`Failed to download ZIP: ${response.status} ${response.statusText}`);
    }
    const zipBuffer = new Uint8Array(await response.arrayBuffer());
    return unzipSync(zipBuffer);
  }

  function _parseDicomFiles(files: Record<string, Uint8Array>): any[] {
    const instances: any[] = [];

    for (const [filename, fileData] of Object.entries(files)) {
      const lowerName = filename.toLowerCase();
      if (!lowerName.endsWith('.dcm') && !lowerName.endsWith('.dicom')) {
        continue;
      }

      try {
        const dicomData = dcmjs.data.DicomMessage.readFile(fileData.buffer);
        const naturalized = naturalizeDataset(dicomData.dict);

        // Preserve file meta information (TransferSyntaxUID etc.) so that
        // dicomWriter can re-serialize the dataset to Part 10 format.
        if (dicomData.meta) {
          naturalized._meta = dicomData.meta;
        }

        if (
          !naturalized.StudyInstanceUID ||
          !naturalized.SeriesInstanceUID ||
          !naturalized.SOPInstanceUID
        ) {
          continue;
        }

        instances.push(naturalized);
      } catch (error) {
        console.warn(`Failed to parse DICOM file: ${filename}`, error);
      }
    }

    return instances;
  }

  const implementation = {
    initialize: async ({ params, query }) => {
      if (_studiesMetadata.length === 0) {
        if (_hasParentWindow()) {
          await _receiveMetadataViaPostMessage();
        }
        if (_studiesMetadata.length === 0) {
          _loadFromLocalStorage();
        }
        if (_studiesMetadata.length === 0) {
          await _receiveMetadataViaUrl(query);
        }
      }
      // Always set up persistent listener for live metadata updates
      _setupPersistentMetadataListener();
    },

    query: {
      studies: {
        mapParams: () => {},
        search: (params?) => {
          if (params?.studyInstanceUid) {
            return _studiesMetadata
              .filter(s => s.studyInstanceUid === params.studyInstanceUid)
              .map(s => ({
                accession: s.accession,
                date: s.date,
                description: s.description,
                mrn: s.patientId,
                patientName: utils.formatPN(s.patientName),
                studyInstanceUid: s.studyInstanceUid,
                time: s.time,
                instances: s.instances,
                modalities: s.modalities,
                NumInstances: s.instances,
              }));
          }

          return _studiesMetadata.map(s => ({
            accession: s.accession,
            date: s.date,
            description: s.description,
            mrn: s.patientId,
            patientName: utils.formatPN(s.patientName),
            studyInstanceUid: s.studyInstanceUid,
            time: s.time,
            instances: s.instances,
            modalities: s.modalities,
            NumInstances: s.instances,
          }));
        },
      },
      series: {
        search: (studyInstanceUID?: string) => {
          const study = (DicomMetadataStore as any).getStudy(studyInstanceUID);
          if (!study) return [];
          return study.series.map(aSeries => {
            const firstInstance = aSeries?.instances[0];
            return {
              studyInstanceUid: studyInstanceUID,
              seriesInstanceUid: firstInstance.SeriesInstanceUID,
              modality: firstInstance.Modality,
              seriesNumber: firstInstance.SeriesNumber,
              seriesDate: firstInstance.SeriesDate,
              numSeriesInstances: aSeries.instances.length,
              description: firstInstance.SeriesDescription,
            };
          });
        },
      },
    },

    retrieve: {
      directURL: (params?) => {
        const { instance, tag, defaultType } = params;
        const value = instance[tag];
        if (value instanceof Array && value[0] instanceof ArrayBuffer) {
          return URL.createObjectURL(new Blob([value[0]], { type: defaultType }));
        }
      },
      series: {
        metadata: async ({ StudyInstanceUID, madeInClient = false } = {} as any) => {
          if (!StudyInstanceUID) {
            throw new Error('Unable to query for SeriesMetadata without StudyInstanceUID');
          }

          const existingStudy = (DicomMetadataStore as any).getStudy(StudyInstanceUID);
          if (existingStudy) {
            (DicomMetadataStore as any)._broadcastEvent(EVENTS.SERIES_ADDED, {
              StudyInstanceUID,
              madeInClient,
            });
            return;
          }

          if (_loadingStudies.has(StudyInstanceUID)) {
            return;
          }
          _loadingStudies.add(StudyInstanceUID);

          try {
            const zipUrl = _zipUrlMap.get(StudyInstanceUID);
            if (!zipUrl) {
              throw new Error(`No zipUrl found for StudyInstanceUID: ${StudyInstanceUID}`);
            }

            uiNotificationService?.show({
              title: 'Loading Study',
              message: 'Downloading and extracting DICOM files...',
              type: 'info',
            });

            const files = await _downloadAndUnzip(zipUrl);
            const instances = _parseDicomFiles(files);

            if (!instances.length) {
              throw new Error(
                `No valid DICOM files found in the ZIP for study: ${StudyInstanceUID}`
              );
            }

            registerNaturalizedDatasetsForLocalWadouri(instances);

            // registerNaturalizedDatasetForLocalWadouri skips instances without
            // PixelData (e.g. RTSTRUCT, SR). Register those manually so that
            // DicomLoaderService can load them via the wadouri file manager.
            instances.forEach(instance => {
              if (instance.url) {
                if (!instance.imageId) {
                  instance.imageId = instance.url;
                }
                return;
              }

              // No url means registerNaturalizedDatasetForLocalWadouri skipped it
              try {
                const blob = datasetToDicomBlob(instance);
                const imageId = dicomImageLoader.wadouri.fileManager.add(blob);
                instance.url = imageId;
                instance.imageId = imageId;
              } catch (e) {
                console.warn(
                  '[Chavi] Failed to register non-pixel instance:',
                  instance.SOPInstanceUID,
                  e
                );
              }
            });

            (DicomMetadataStore as any).addInstances(instances, madeInClient);

            const study = (DicomMetadataStore as any).getStudy(StudyInstanceUID);
            if (study) {
              study.series = study.series.sort(customSort);

              (DicomMetadataStore as any)._broadcastEvent(EVENTS.SERIES_ADDED, {
                StudyInstanceUID,
                madeInClient,
              });

              study.series.forEach(aSeries => {
                const { SeriesInstanceUID } = aSeries;
                const isMultiframe = aSeries.instances[0].NumberOfFrames > 1;

                aSeries.instances.forEach((instance, index) => {
                  const {
                    url: imageId,
                    StudyInstanceUID: instStudyUID,
                    SeriesInstanceUID: instSeriesUID,
                    SOPInstanceUID,
                  } = instance;

                  if (imageId) {
                    metadataProvider.addImageIdToUIDs(imageId, {
                      StudyInstanceUID: instStudyUID,
                      SeriesInstanceUID: instSeriesUID,
                      SOPInstanceUID,
                      frameNumber: isMultiframe ? index + 1 : 1,
                    });
                  }
                });

                (DicomMetadataStore as any)._broadcastEvent(EVENTS.INSTANCES_ADDED, {
                  StudyInstanceUID,
                  SeriesInstanceUID,
                  madeInClient,
                });
              });
            }

            uiNotificationService?.show({
              title: 'Study Loaded',
              message: `Loaded ${instances.length} DICOM instances`,
              type: 'success',
            });
          } catch (error) {
            console.error(`Failed to load study ZIP: ${StudyInstanceUID}`, error);
            uiNotificationService?.show({
              title: 'Load Error',
              message: `Failed to load study: ${(error as Error).message}`,
              type: 'error',
            });
          } finally {
            _loadingStudies.delete(StudyInstanceUID);
          }
        },
      },
    },

    getImageIdsForDisplaySet(displaySet) {
      const images = displaySet.images;
      const imageIds = [];
      if (!images) return imageIds;

      displaySet.images.forEach(instance => {
        const NumberOfFrames = instance.NumberOfFrames;
        if (NumberOfFrames > 1) {
          for (let i = 1; i <= NumberOfFrames; i++) {
            const imageId = this.getImageIdsForInstance({ instance, frame: i });
            imageIds.push(imageId);
          }
        } else {
          const imageId = this.getImageIdsForInstance({ instance });
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },

    getImageIdsForInstance({ instance, frame }) {
      const { StudyInstanceUID, SeriesInstanceUID } = instance;
      const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;
      const storedInstance = (DicomMetadataStore as any).getInstance(
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID
      );

      const baseImageId = storedInstance?.url || instance.url;
      if (!baseImageId) return;

      const numberOfFrames = Number(storedInstance?.NumberOfFrames || instance.NumberOfFrames) || 1;

      if (numberOfFrames > 1) {
        const frameNumber = frame !== undefined ? frame : 1;
        return appendFrameQueryToImageId(baseImageId, frameNumber);
      }

      return baseImageId;
    },

    getStudyInstanceUIDs: ({ params, query }) => {
      const queryStudyInstanceUIDs = query.getAll('StudyInstanceUIDs');
      const paramsStudyInstanceUIDs = params.StudyInstanceUIDs;

      const StudyInstanceUIDs =
        (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) ||
        paramsStudyInstanceUIDs ||
        _initialStudyInstanceUIDs ||
        _studiesMetadata.map(s => s.studyInstanceUid);

      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];

      let isStudyInCache = false;
      StudyInstanceUIDsAsArray.forEach((StudyInstanceUID: string) => {
        const study = (DicomMetadataStore as any).getStudy(StudyInstanceUID);
        if (study) {
          study.series = study.series.sort(customSort);
          isStudyInCache = true;
        }
      });

      return isStudyInCache
        ? StudyInstanceUIDsAsArray
        : _initialStudyInstanceUIDs || StudyInstanceUIDsAsArray;
    },

    getConfig: () => dicomZipConfig,

    store: { dicom: () => {} },
    reject: {},
    deleteStudyMetadataPromise: () => {},
  };

  return IWebApiDataSource.create(implementation);
}

export { createDicomZipApi };
