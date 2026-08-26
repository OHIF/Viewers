import { SOPClassHandlerId } from './id';
import { utils, Types as OhifTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import {
  getDisplayableDocumentType,
  normalizeDocumentMimeType,
} from './utils/displayableDocumentTypes';

const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  const dataSource = extensionManager.getActiveDataSource()[0];
  return instances.map(instance => {
    const { Modality, SOPInstanceUID } = instance;
    const { SeriesDescription = 'PDF', MIMETypeOfEncapsulatedDocument } = instance;
    const { SeriesNumber, SeriesDate, SeriesInstanceUID, StudyInstanceUID, SOPClassUID } = instance;
    // The declared type is carried through to the viewport, which resolves it
    // against the displayable-type allowlist and re-wraps the payload in a Blob
    // of the canonical type. Here it only decides what to ask the origin server
    // for, so the canonical spelling is preferred when the type is one we know.
    const mimeType = normalizeDocumentMimeType(MIMETypeOfEncapsulatedDocument) || 'application/pdf';
    const documentType = getDisplayableDocumentType(mimeType);

    const renderedUrlParams = {
      instance,
      tag: 'EncapsulatedDocument',
      defaultType: documentType?.mimeType || mimeType,
      singlepart: 'pdf',
    };
    const renderedUrl = dataSource.retrieve.directURL(renderedUrlParams);
    const getRenderedUrl = dataSource.retrieve.renderedURL
      ? options =>
          dataSource.retrieve.renderedURL({ ...renderedUrlParams, url: renderedUrl }, options)
      : undefined;

    const displaySet = {
      //plugin: id,
      Modality,
      displaySetInstanceUID: utils.guid(),
      SeriesDescription,
      SeriesNumber,
      SeriesDate,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
      SOPClassHandlerId,
      SOPClassUID,
      referencedImages: null,
      measurements: null,
      renderedUrl: renderedUrl,
      getRenderedUrl,
      mimeType,
      instances: [instance],
      thumbnailSrc: null,
      isDerivedDisplaySet: true,
      isLoaded: false,
      sopClassUids,
      numImageFrames: 0,
      numInstances: 1,
      instance,
      supportsWindowLevel: true,
      label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t(Modality)}`,
    };
    return displaySet;
  });
};

export default function getSopClassHandlerModule(params) {
  const { servicesManager, extensionManager } = params;
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'dicom-pdf',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
