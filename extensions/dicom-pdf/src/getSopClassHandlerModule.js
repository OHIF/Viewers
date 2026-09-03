import { SOPClassHandlerId } from './id';
import { utils, Types as OhifTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { normalizeDocumentMimeType } from './utils/displayableDocumentTypes';
import { loadDisplayableDocument } from './utils/loadDisplayableDocument';

const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  return instances.map(instance => {
    const { Modality, SOPInstanceUID } = instance;
    const { SeriesDescription = 'PDF', MIMETypeOfEncapsulatedDocument } = instance;
    const { SeriesNumber, SeriesInstanceUID, StudyInstanceUID, SOPClassUID } = instance;
    // The date/time of a display set is the date/time of the instance it shows,
    // chosen from all the attributes that instance carries.
    const { SeriesDate, SeriesTime } = utils.getSeriesDateTime(instance);
    // The declared type is only a claim. It is resolved against the displayable
    // type allowlist, and the payload is re-wrapped in a Blob of the canonical
    // type, so the instance cannot steer how the browser parses the document.
    const mimeType = normalizeDocumentMimeType(MIMETypeOfEncapsulatedDocument) || 'application/pdf';

    const documentParams = {
      instance,
      tag: 'EncapsulatedDocument',
      mimeType,
    };
    const getDocument = options => loadDisplayableDocument(documentParams, options);

    const displaySet = {
      //plugin: id,
      Modality,
      displaySetInstanceUID: utils.guid(),
      SeriesDescription,
      SeriesNumber,
      SeriesDate,
      SeriesTime,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
      SOPClassHandlerId,
      SOPClassUID,
      referencedImages: null,
      measurements: null,
      getDocument,
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
