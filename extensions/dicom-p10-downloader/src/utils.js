import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import { saveAs } from 'file-saver';

const {
  utils: { isDicomUid, resolveObjectPath, hierarchicalListUtils },
  DICOMWeb,
} = OHIF;

function validDicomUid(subject) {
  if (isDicomUid(subject)) {
    return subject;
  }
}

function getActiveServerFromServersStore(store) {
  const servers = resolveObjectPath(store, 'servers');
  if (Array.isArray(servers) && servers.length > 0) {
    return servers.find(server => resolveObjectPath(server, 'active') === true);
  }
}

function getDicomWebClientFromConfig(config) {
  const servers = resolveObjectPath(config, 'servers.dicomWeb');
  if (Array.isArray(servers) && servers.length > 0) {
    const server = servers[0];
    return new api.DICOMwebClient({
      url: server.wadoRoot,
      headers: DICOMWeb.getAuthorizationHeader(server),
    });
  }
}

function getDicomWebClientFromContext(context, store) {
  const activeServer = getActiveServerFromServersStore(store);
  if (activeServer) {
    return new api.DICOMwebClient({
      url: activeServer.wadoRoot,
      headers: DICOMWeb.getAuthorizationHeader(activeServer),
    });
  } else if (context.dicomWebClient instanceof api.DICOMwebClient) {
    return context.dicomWebClient;
  }
}

function getSOPInstanceReference(viewports, index) {
  if (index >= 0) {
    const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = Object(
      resolveObjectPath(viewports, `viewportSpecificData.${index}`)
    );
    return Object.freeze(
      hierarchicalListUtils.addToList(
        [],
        validDicomUid(StudyInstanceUID),
        validDicomUid(SeriesInstanceUID),
        validDicomUid(SOPInstanceUID)
      )
    );
  }
}

function getSOPInstanceReferenceFromActiveViewport(viewports) {
  return getSOPInstanceReference(
    viewports,
    resolveObjectPath(viewports, 'activeViewportIndex')
  );
}

function getSOPInstanceReferencesFromViewports(viewports) {
  const list = [];
  const viewportSpecificData = resolveObjectPath(
    viewports,
    'viewportSpecificData'
  );
  Object.keys(viewportSpecificData).forEach(index => {
    const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = Object(
      viewportSpecificData[index]
    );
    hierarchicalListUtils.addToList(
      list,
      validDicomUid(StudyInstanceUID),
      validDicomUid(SeriesInstanceUID),
      validDicomUid(SOPInstanceUID)
    );
  });
  return list;
}

function save(promise, listOfUIDs) {
  return Promise.resolve(promise)
    .then(url => {
      OHIF.log.info('Files successfully compressed:', url);
      const StudyInstanceUID = hierarchicalListUtils.getItem(listOfUIDs, 0);
      saveAs(url, `${StudyInstanceUID}.zip`);
      return url;
    })
    .catch(error => {
      OHIF.log.error('Failed to create Zip file...', error);
      return null;
    });
}

function getStudyInstanceUIDFromStudies(studies) {
  return Object.keys(Object(Object(studies).studyData)).slice(0, 1);
}

export {
  save,
  validDicomUid,
  getDicomWebClientFromConfig,
  getDicomWebClientFromContext,
  getStudyInstanceUIDFromStudies,
  getSOPInstanceReferenceFromActiveViewport,
  getSOPInstanceReferencesFromViewports,
};
