import fetchJSON from './fetchJSON';
import getReferencedScan from '../getReferencedScan';

const queryXnatSessionRoiCollections = session => {
  const { projectId, subjectId, experimentId } = session;

  return fetchJSON(
    `data/archive/projects/${projectId}/subjects/${subjectId}/experiments/${experimentId}/assessors?format=json`
  );
};

const queryXnatRoiCollection = (session, assessorId) => {
  const { projectId, subjectId, experimentId } = session;

  return fetchJSON(
    `data/archive/projects/${projectId}/subjects/${subjectId}/experiments/${experimentId}/assessors/${assessorId}?format=json`
  );
};

const getCollectionInfo = collectionJSON => {
  const item = collectionJSON.items[0];
  const data_fields = item.data_fields;

  const referencedScan = getReferencedScan(collectionJSON);
  if (referencedScan) {
    return {
      collectionType: data_fields.collectionType,
      label: data_fields.label,
      experimentId: data_fields.imageSession_ID,
      experimentLabel: referencedScan.experimentLabel,
      referencedSeriesInstanceUid: referencedScan.seriesInstanceUid,
      referencedSeriesNumber: referencedScan.seriesNumber,
      name: data_fields.name,
      date: data_fields.date,
      time: data_fields.time,
      getFilesUri: `data/archive/experiments/${data_fields.imageSession_ID}/assessors/${data_fields.ID}/files?format=json`,
    };
  }
};

class XnatSessionRoiCollections {
  constructor() {
    this._cancelablePromises = [];
  }
  async queryAll(session) {
    const roiCollections = {};

    const cancelablePromise = queryXnatSessionRoiCollections(session);
    this._cancelablePromises.push(cancelablePromise);
    const result = await cancelablePromise.promise;

    if (result.ResultSet && result.ResultSet.Result) {
      const assessors = result.ResultSet.Result.filter(
        assessor => assessor.xsiType === 'icr:roiCollectionData'
      );
      const roiCollectionPromises = [];
      for (let i = 0; i < assessors.length; i++) {
        const cancelablePromise = queryXnatRoiCollection(
          session,
          assessors[i].ID
        );
        this._cancelablePromises.push(cancelablePromise);
        roiCollectionPromises.push(cancelablePromise.promise);
      }
      const promisesJSON = await Promise.all(roiCollectionPromises);
      promisesJSON.forEach(collectionJSON => {
        if (!collectionJSON) {
          return;
        }
        const parsedCollectionJSON = getCollectionInfo(collectionJSON);
        if (parsedCollectionJSON) {
          const { referencedSeriesInstanceUid, collectionType } = parsedCollectionJSON;
          if (roiCollections[referencedSeriesInstanceUid] === undefined) {
            roiCollections[referencedSeriesInstanceUid] = {
              RTS: [],
              SEG: [],
            };
          }
          const collection = roiCollections[referencedSeriesInstanceUid];
          if (collectionType === 'RTSTRUCT' || collectionType === 'AIM') {
            collection.RTS.push(parsedCollectionJSON);
          } else if (collectionType === 'SEG') {
            //|| collectionType === 'NIFTI'
            collection.SEG.push(parsedCollectionJSON);
          }
        }
      });
    }

    return roiCollections;
  }
  cancel() {
    for (let i = 0; i < this._cancelablePromises.length; i++) {
      if (typeof this._cancelablePromises[i].cancel === 'function') {
        this._cancelablePromises[i].cancel();
      }
    }
  }
}

export {
  queryXnatSessionRoiCollections,
  queryXnatRoiCollection,
  XnatSessionRoiCollections as default,
};
