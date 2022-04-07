export default function unpackOverlay(arrayBuffer) {
  const bitArray = new Uint8Array(arrayBuffer);
  const byteArray = new Uint8Array(8 * bitArray.length);

  for (let byteIndex = 0; byteIndex < byteArray.length; byteIndex++) {
    const bitIndex = byteIndex % 8;
    const bitByteIndex = Math.floor(byteIndex / 8);
    byteArray[byteIndex] =
      1 * ((bitArray[bitByteIndex] & (1 << bitIndex)) >> bitIndex);
  }

  return byteArray;
}
