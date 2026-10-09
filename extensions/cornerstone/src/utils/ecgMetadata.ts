import { utilities as csMetadataUtilities } from '@cornerstonejs/metadata';

export type EcgModule = NonNullable<
  ReturnType<typeof csMetadataUtilities.buildEcgModuleFromInstance>
>;

/**
 * Parse the naturalized DICOM instance's WaveformSequence and build the ecgModule
 * that Cornerstone's ECGViewport.setEcg() expects via
 * metaData.get(MetadataModules.ECG, imageId).
 *
 * Cornerstone decodes the waveform. When the data source attached a
 * `retrieveBulkData` to `WaveformData`, that method fetches the bytes, so the
 * data source handles multipart/related, auth and relative bulkdata URIs.
 *
 * Returns null if the instance has no WaveformSequence.
 */
export function buildEcgModule(instance: any, userAuthenticationService?: any): EcgModule | null {
  if (!instance?.WaveformSequence?.length) {
    return null;
  }

  const ecgModule = csMetadataUtilities.buildEcgModuleFromInstance(instance, instance.imageId, {
    getHeaders: () => userAuthenticationService?.getAuthorizationHeader?.(),
  });
  const [group] = instance.WaveformSequence;
  const waveformData = Array.isArray(group.WaveformData)
    ? group.WaveformData[0]
    : group.WaveformData;

  if (ecgModule && typeof waveformData?.retrieveBulkData === 'function') {
    ecgModule.waveformData.retrieveBulkData = async () => {
      const bytes = await waveformData.retrieveBulkData();
      const loaded = { WaveformSequence: [{ ...group, WaveformData: bytes }] };
      return csMetadataUtilities.buildEcgModuleFromInstance(loaded).waveformData.retrieveBulkData();
    };
  }

  return ecgModule;
}
