import { chartSopClassUids, defaultMetadataContext } from '@cornerstonejs/metadata';
import { ChartDataSOPClassUid } from '../SOPClassHandlers/chartSOPClassHandler';

/**
 * The `metadataContext` customization: the named lists and expressions that
 * the split rules read, for example `imageSopClassUids` and `isImage`.
 *
 * The value is the `@cornerstonejs/metadata` `defaultMetadataContext`, with
 * the OHIF private chart SOP class added to the end of `chartSopClassUids`
 * (the same result as a `$push`). It is data only, so a server that applies
 * the same customization files with `immutability-helper` gets the same
 * context. A site changes a list with a standard command:
 *
 * ```jsonc
 * { "metadataContext": { "imageSopClassUids": { "$push": ["1.2.3.4"] } } }
 * ```
 *
 * It is a customization of its own, and not a part of `useMetadataDisplaySet`,
 * so that other features can read it when the split rules are off.
 */
export default function getMetadataContextCustomization() {
  return {
    metadataContext: {
      ...defaultMetadataContext,
      chartSopClassUids: [...chartSopClassUids, ChartDataSOPClassUid],
    },
  };
}
