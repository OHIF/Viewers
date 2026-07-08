export const LABELMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.7';
export const BITMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.4';

export type SegmentationMode = 'labelmap' | 'bitmap';

/**
 * Per-data-source overrides for the SEG store defaults. A data source may set
 * these under `configuration.segmentation.store` to override the values coming
 * from the `segmentation.store.*` customizations. Different back ends support
 * different SEG encodings, so the data source is allowed to win over the
 * app-wide customization default.
 */
export type SegmentationStoreOverride = {
  defaultMode?: SegmentationMode;
  transferSyntaxUID?: string;
};

type SegmentationCustomizationReader = {
  getCustomization: (customizationId: string) => unknown;
};

function getStoreDefaultMode(
  customizationService?: SegmentationCustomizationReader,
  override?: SegmentationStoreOverride
): SegmentationMode {
  // Data-source override wins over the customization default.
  const mode =
    override?.defaultMode ??
    (customizationService?.getCustomization('segmentation.store.defaultMode') as
      | SegmentationMode
      | undefined);

  return mode === 'bitmap' ? 'bitmap' : 'labelmap';
}

function getStoreTransferSyntaxUID(
  customizationService?: SegmentationCustomizationReader,
  override?: SegmentationStoreOverride
): string | undefined {
  // Data-source override wins over the customization default.
  const transferSyntaxUID =
    override?.transferSyntaxUID ??
    (customizationService?.getCustomization('segmentation.store.transferSyntaxUID') as
      | string
      | undefined);

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
 *
 * @param customizationService - reads the app-wide `segmentation.store.*` defaults.
 * @param override - optional per-data-source override (e.g.
 *   `configuration.segmentation.store`) that takes precedence over the customization.
 */
export function getSegmentationSaveOptions(
  customizationService?: SegmentationCustomizationReader,
  override?: SegmentationStoreOverride
): {
  sopClassUID: string;
  transferSyntaxUID?: string;
} {
  const defaultMode = getStoreDefaultMode(customizationService, override);
  const sopClassUID =
    defaultMode === 'bitmap' ? BITMAP_SEG_SOP_CLASS_UID : LABELMAP_SEG_SOP_CLASS_UID;
  const transferSyntaxUID = getStoreTransferSyntaxUID(customizationService, override);

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
