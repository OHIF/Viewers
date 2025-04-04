import { SOPClassHandlerId } from './id';
import { utils, classes } from '@ohif/core';

const { ImageSet } = classes;

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
    const pdfUrl = dataSource.retrieve.directURL({
      instance,
      tag: 'EncapsulatedDocument',
      defaultType: MIMETypeOfEncapsulatedDocument || 'application/pdf',
      singlepart: 'pdf',
    });

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
      pdfUrl,
      instances: [instance],
      thumbnailSrc: dataSource.retrieve.directURL({
        instance,
        defaultPath: '/thumbnail',
        defaultType: 'image/jpeg',
        tag: 'Absent',
      }),
      isDerivedDisplaySet: true,
      isLoaded: false,
      sopClassUids,
      numImageFrames: 0,
      numInstances: 1,
      instance,
    };
    return displaySet;
  });
};

export default function getSopClassHandlerModule({ servicesManager, extensionManager }) {
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
