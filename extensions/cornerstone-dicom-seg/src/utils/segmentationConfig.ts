export const LABELMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.7';
export const BITMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.4';

export type SegmentationMode = 'labelmap' | 'bitmap';

type SegmentationCustomizationReader = {
  getCustomization: (customizationId: string) => unknown;
};

function getStoreDefaultMode(
  customizationService?: SegmentationCustomizationReader
): SegmentationMode {
  const mode = customizationService?.getCustomization(
    'segmentation.store.defaultMode'
  ) as SegmentationMode | undefined;

  return mode === 'bitmap' ? 'bitmap' : 'labelmap';
}

function getStoreTransferSyntaxUID(
  customizationService?: SegmentationCustomizationReader
): string | undefined {
  const transferSyntaxUID = customizationService?.getCustomization(
    'segmentation.store.transferSyntaxUID'
  ) as string | undefined;

  return transferSyntaxUID || undefined;
}

/**
 * Resolves the parser type for loading a DICOM SEG instance.
 * Uses the instance SOP Class UID when it is a known SEG class; otherwise falls back to store defaultMode.
 */
export function getSegmentationParserType(
  sopClassUID: string | undefined,
  customizationService?: SegmentationCustomizationReader
): SegmentationMode {
  if (sopClassUID === LABELMAP_SEG_SOP_CLASS_UID) {
    return 'labelmap';
  }

  if (sopClassUID === BITMAP_SEG_SOP_CLASS_UID) {
    return 'bitmap';
  }

  return getStoreDefaultMode(customizationService) === 'labelmap' ? 'labelmap' : 'bitmap';
}

/**
 * Options passed to @cornerstonejs/adapters generateSegmentation when exporting or storing SEG.
 */
export function getSegmentationSaveOptions(
  customizationService?: SegmentationCustomizationReader
): {
  sopClassUID: string;
  transferSyntaxUID?: string;
} {
  const defaultMode = getStoreDefaultMode(customizationService);
  const sopClassUID =
    defaultMode === 'bitmap' ? BITMAP_SEG_SOP_CLASS_UID : LABELMAP_SEG_SOP_CLASS_UID;
  const transferSyntaxUID = getStoreTransferSyntaxUID(customizationService);

  const options: {
    sopClassUID: string;
    transferSyntaxUID?: string;
    transferSyntaxUid?: string;
  } = { sopClassUID };

  if (transferSyntaxUID) {
    options.transferSyntaxUID = transferSyntaxUID;
    options.transferSyntaxUid = transferSyntaxUID;
  }

  return options;
}
