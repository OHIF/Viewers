import { SOPClassHandlerId } from './id';
import { utils, Types as OhifTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { normalizeDocumentMimeType } from './utils/displayableDocumentTypes';
import { loadDisplayableDocument } from './utils/loadDisplayableDocument';

const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

/**
 * The document fields of a display set that shows `instance`. Shared by the
 * legacy builder and {@link extendDocumentDisplaySet}.
 */
const getDocumentFields = instance => {
  const { Modality, SOPInstanceUID } = instance;
  const { SeriesDescription = 'PDF', MIMETypeOfEncapsulatedDocument } = instance;
  const { SeriesNumber, SOPClassUID } = instance;
  // The date/time of a display set is the date/time of the instance it shows,
  // chosen from all the attributes that instance carries.
  const { SeriesDate, SeriesTime } = utils.getLatestInstanceDateTime(instance);
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

  return {
    //plugin: id,
    Modality,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SeriesTime,
    SOPInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    referencedImages: null,
    measurements: null,
    getDocument,
    mimeType,
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
};

const _getDisplaySetsFromSeries = instances => {
  return instances.map(instance => {
    const { SeriesInstanceUID, StudyInstanceUID } = instance;
    return {
      ...getDocumentFields(instance),
      displaySetInstanceUID: utils.guid(),
      SeriesInstanceUID,
      StudyInstanceUID,
      instances: [instance],
    };
  });
};

/**
 * Adds the document fields to a display set that a split rule with the
 * `encapsulatedDocument` handler made. The display set holds a revision chain,
 * and shows the instance `activeSopInstanceUid` names, else the last one. An
 * update chooses again.
 */
const extendDocumentDisplaySet = displaySet => {
  const { instances, activeSopInstanceUid } = displaySet;
  const active =
    instances.find(instance => instance.SOPInstanceUID === activeSopInstanceUid) ??
    instances[instances.length - 1];
  Object.assign(displaySet, getDocumentFields(active));
};

export default function getSopClassHandlerModule() {
  return [
    {
      name: 'dicom-pdf',
      sopClassUids,
      getDisplaySetsFromSeries: _getDisplaySetsFromSeries,
      handlerNames: ['encapsulatedDocument'],
      extendDisplaySet: extendDocumentDisplaySet,
    },
  ];
}
