/**
 * Gets the palette color data for the specified tag - red/green/blue,
 * either from the given UID or from the tag itself.
 * Returns an array if the data is immediately available, or a promise
 * which resolves to the data if the data needs to be loaded.
 * Returns undefined if the palette isn't specified.
 *
 * @param {*} item containing the palette colour data and description
 * @param {*} tag is the tag for the palette data
 * @param {*} descriptorTag is the tag for the descriptor
 * @returns Array view containing the palette data, or a promise to return one.
 * Returns undefined if the palette data is absent.
 */
export default function fetchPaletteColorLookupTableData(item, tag, descriptorTag) {
  const { PaletteColorLookupTableUID } = item;
  const paletteData = item[tag];
  if (paletteData === undefined && PaletteColorLookupTableUID === undefined) {
    return;
  }
  // performance optimization - read UID and cache by UID
  return _getPaletteColor(item[tag], item[descriptorTag]);
}

function _getPaletteColor(paletteColorLookupTableData, lutDescriptor) {
  // DICOM standard says to use 64k instead of 0 as 64k isn't specifiable in
  // 2 bytes.
  const numLutEntries = lutDescriptor[0] || 65536;
  const bitsAllocated = lutDescriptor[2];

  if (!paletteColorLookupTableData) {
    return undefined;
  }

  const arrayBufferToPaletteColorLUT = arraybuffer => {
    // Handle both ArrayBuffer and TypedArray inputs
    const buffer = arraybuffer.buffer || arraybuffer;
    // See note in PS3.3 C7.6.3.1.5 around 8 bit data encoded as 16 bit
    const data =
      buffer.byteLength === 2 * numLutEntries || bitsAllocated > 8
        ? new Uint16Array(buffer)
        : new Uint8Array(buffer);
    const lut = [];

    for (let i = 0; i < numLutEntries; i++) {
      lut[i] = data[i];
    }

    return lut;
  };

  if (paletteColorLookupTableData.palette) {
    return paletteColorLookupTableData.palette;
  }

  if (paletteColorLookupTableData.InlineBinary) {
    try {
      const uint8Array = Uint8Array.from(atob(paletteColorLookupTableData.InlineBinary), c =>
        c.charCodeAt(0)
      );
      return (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(uint8Array));
    } catch (e) {
      console.log("Couldn't decode", paletteColorLookupTableData.InlineBinary, e);
      return undefined;
    }
  }

  const arrayPalette = Array.isArray(paletteColorLookupTableData)
    ? paletteColorLookupTableData[0]
    : paletteColorLookupTableData;
  if (arrayPalette instanceof ArrayBuffer) {
    return (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(arrayPalette));
  }

  if (paletteColorLookupTableData.retrieveBulkData) {
    return paletteColorLookupTableData
      .retrieveBulkData()
      .then(val => (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(val)));
  }

  console.error(`No data found for ${paletteColorLookupTableData} palette`);
}
