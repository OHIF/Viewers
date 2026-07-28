// SOP class handlers claim series into display sets: the viewer groups
// instances by series, asks each handler in turn, and the first whose
// sopClassUids match produces the display sets shown in the study browser.

const SOP_CLASS_UIDS = {
  SECONDARY_CAPTURE: '1.2.840.10008.5.1.4.1.1.7',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

// Local uid helper: keeps the template runtime-dependency-free.
function guid() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}

/**
 * Maps a series' instances to display set objects. The field set below is the
 * minimal shape the viewer expects (modeled on the dicom-pdf extension's
 * handler); extend it with whatever your viewport component needs.
 */
export default function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    const instance = instances[0];
    const { SeriesInstanceUID, StudyInstanceUID, SeriesDescription, SeriesNumber, Modality } =
      instance;

    return [
      {
        displaySetInstanceUID: guid(),
        SOPClassHandlerId: '{{name}}.sopClassHandlerModule.example',
        SeriesInstanceUID,
        StudyInstanceUID,
        SeriesDescription: SeriesDescription || 'Example display set',
        SeriesNumber,
        Modality,
        sopClassUids,
        instances,
        numInstances: instances.length,
        isDerivedDisplaySet: false,
        isLoaded: true,
      },
    ];
  };

  return [
    {
      name: 'example',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
