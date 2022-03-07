import { api } from 'dicomweb-client';
import DICOMWeb from '../../DICOMWeb';
import str2ab from '../str2ab';

import errorHandler from '../../errorHandler';

/**
 * Gets the palette color data for the specified tag - red/green/blue,
 * either from the given UID or from the tag itself.
 * Returns an array if the data is immediately available, or a promise
 * which resolves to the data if the data needs to be loaded.
 * Returns undefined if the palette isn't specified.
 */
export default function fetchPaletteColorLookupTableData(
  item, tag, descriptorTag
) {
  const { PaletteColorLookupTableUID } = item;
  const paletteData = item[tag];
  if (paletteData === undefined && PaletteColorLookupTableUID === undefined) return;
  // TODO - read UID and cache by UID
  return _getPaletteColor(
    item[tag],
    item[descriptorTag]
  )
}

function _getPaletteColor(paletteColorLookupTableData, lutDescriptor) {
  const numLutEntries = lutDescriptor[0];
  const bits = lutDescriptor[2];

  if (!paletteColorLookupTableData) return undefined;

  const arrayBufferToPaletteColorLUT = arraybuffer => {
    const lut = [];

    if (bits === 16) {
      let j = 0;
      for (let i = 0; i < numLutEntries; i++) {
        lut[i] = arraybuffer[j++] + arraybuffer[j++] << 8;
      }
    } else {
      for (let i = 0; i < numLutEntries; i++) {
        lut[i] = byteArray[i];
      }

    }
    return lut;
  };

  if (paletteColorLookupTableData.palette) {
    return paletteColorLookupTableData.palette;
  }

  if (paletteColorLookupTableData.InlineBinary) {
    try {
      const arraybuffer = Uint8Array.from(atob(paletteColorLookupTableData.InlineBinary), c =>
        c.charCodeAt(0)
      );
      return (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(arraybuffer));
    } catch (e) {
      console.log("Couldn't decode", paletteColorLookupTableData.InlineBinary, e);
      return undefined;
    }
  }

  if (paletteColorLookupTableData.retrieveBulkData) {
    return paletteColorLookupTableData.retrieveBulkData().then(val =>
      (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(val)));
  }

  throw new Error(`No data found for ${paletteColorLookupTableData} palette`)
}
