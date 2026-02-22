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
  const numLutEntries = lutDescriptor[0];
  const bits = lutDescriptor[2];

  if (!paletteColorLookupTableData) {
    return undefined;
  }

  const arrayBufferToPaletteColorLUT = (arraybuffer) => {
    // Handle both ArrayBuffer and TypedArray inputs
    const buffer = arraybuffer.buffer || arraybuffer;
    // const data = bits === 16 ? new Uint16Array(buffer) : new Uint8Array(buffer);

    const view = new DataView(buffer);
    const offsetBits = bits - 8;

    const lut = new Uint8Array(numLutEntries);

    // Extract LUT values (always read as 16-bit)
    for (let i = 0; i < numLutEntries; i++) {
      // Read 16-bit value (LUT is always 16-bit)
      const lutValue16 = view.getUint16(i * 2, true);

      // Apply Orthanc shift logic
      if (offsetBits >= 0) {
        lut[i] = (lutValue16 >> offsetBits) & 0xff;
      } else {
        // If bitsPerEntry < 8, shift left
        lut[i] = (lutValue16 << Math.abs(offsetBits)) & 0xff;
      }
    }

    return lut;
  };

  if (paletteColorLookupTableData.palette) {
    return paletteColorLookupTableData.palette;
  }

  if (paletteColorLookupTableData.InlineBinary) {
    try {
      const uint8Array = Uint8Array.from(atob(paletteColorLookupTableData.InlineBinary), (c) => c.charCodeAt(0));
      return (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(uint8Array));
    } catch (e) {
      console.log("Couldn't decode", paletteColorLookupTableData.InlineBinary, e);
      return undefined;
    }
  }

  if (paletteColorLookupTableData.retrieveBulkData) {
    return paletteColorLookupTableData
      .retrieveBulkData()
      .then((val) => (paletteColorLookupTableData.palette = arrayBufferToPaletteColorLUT(val)));
  }

  console.error(`No data found for ${paletteColorLookupTableData} palette`);
}
