/**
 * Encodes a non-bitpacked frame which has one sample per pixel.
 *
 * @param {*} buffer
 * @param {*} numberOfFrames
 * @param {*} rows
 * @param {*} cols
 */
function encode(buffer, numberOfFrames, rows, cols) {
  const frameLength = rows * cols;

  const header = createHeader();
  const encodedFrames = [];

  for (let frame = 0; frame < numberOfFrames; frame++) {
    const frameOffset = frameLength * frame;

    encodedFrames.push(encodeFrame(buffer, frameOffset, rows, cols, header));
  }

  return encodedFrames;
}

function encodeFrame(buffer, frameOffset, rows, cols, header) {
  // Add header to frame:
  let rleArray = [];

  for (let r = 0; r < rows; r++) {
    const rowOffset = r * cols;
    const uint8Row = new Uint8Array(buffer, frameOffset + rowOffset, cols);

    let i = 0;

    while (i < uint8Row.length) {
      const literalRunLength = getLiteralRunLength(uint8Row, i);

      if (literalRunLength) {
        // State how many in litteral run
        rleArray.push(literalRunLength - 1);
        // Append litteral run.
        const literalRun = uint8Row.slice(i, i + literalRunLength);

        rleArray = [...rleArray, ...literalRun];

        i += literalRunLength;
      }

      if (i >= uint8Row.length) {
        break;
      }

      // Next must be a replicate run.
      const replicateRunLength = getReplicateRunLength(uint8Row, i);

      if (replicateRunLength) {
        // State how many in replicate run
        rleArray.push(257 - replicateRunLength);
        rleArray.push(uint8Row[i]);

        i += replicateRunLength;
      }
    }
  }

  const headerLength = 64;

  const bodyLength =
    rleArray.length % 2 === 0 ? rleArray.length : rleArray.length + 1;

  const encodedFrameBuffer = new ArrayBuffer(headerLength + bodyLength);

  // Copy header into encodedFrameBuffer.
  const headerView = new Uint32Array(encodedFrameBuffer, 0, 16);

  for (let i = 0; i < headerView.length; i++) {
    headerView[i] = header[i];
  }

  for (let i = 0; i < headerView.length; i++) {
    rleArray.push(headerView[i]);
  }

  // Copy rle data into encodedFrameBuffer.
  const bodyView = new Uint8Array(encodedFrameBuffer, 64);

  for (let i = 0; i < rleArray.length; i++) {
    bodyView[i] = rleArray[i];
  }

  return encodedFrameBuffer;
}

function createHeader() {
  const headerUint32 = new Uint32Array(16);

  headerUint32[0] = 1; // 1 Segment.
  headerUint32[1] = 64; // Data offset is 64 bytes.

  // Return byte-array version of header:
  return headerUint32;
}

function getLiteralRunLength(uint8Row, i) {
  for (let l = 0; l < uint8Row.length - i; l++) {
    if (
      uint8Row[i + l] === uint8Row[i + l + 1] &&
      uint8Row[i + l + 1] === uint8Row[i + l + 2]
    ) {
      return l;
    }

    if (l === 128) {
      return l;
    }
  }

  return uint8Row.length - i;
}

function getReplicateRunLength(uint8Row, i) {
  const first = uint8Row[i];

  for (let l = 1; l < uint8Row.length - i; l++) {
    if (uint8Row[i + l] !== first) {
      return l;
    }

    if (l === 128) {
      return l;
    }
  }

  return uint8Row.length - i;
}

function decode(rleEncodedFrames, rows, cols) {
  const pixelData = new Uint8Array(rows * cols * rleEncodedFrames.length);
  const buffer = pixelData.buffer;
  const frameLength = rows * cols;

  for (let i = 0; i < rleEncodedFrames.length; i++) {
    const rleEncodedFrame = rleEncodedFrames[i];

    const uint8FrameView = new Uint8Array(buffer, i * frameLength, frameLength);

    decodeFrame(rleEncodedFrame, uint8FrameView);
  }

  return pixelData;
}

function decodeFrame(rleEncodedFrame, pixelData) {
  // Check HEADER:
  const header = new Uint32Array(rleEncodedFrame, 0, 16);

  if (header[0] !== 1) {
    console.error(
      `rleSingleSamplePerPixel only supports fragments with single Byte Segments (for rle encoded segmentation data) at the current time. This rleEncodedFrame has ${
        header[0]
      } Byte Segments.`
    );

    return;
  }

  if (header[1] !== 64) {
    console.error(
      'Data offset of Byte Segment 1 should be 64 bytes, this rle fragment is encoded incorrectly.'
    );

    return;
  }

  const uInt8Frame = new Uint8Array(rleEncodedFrame, 64);

  let pixelDataIndex = 0;
  let i = 0;

  while (pixelDataIndex < pixelData.length) {
    const byteValue = uInt8Frame[i];

    if (byteValue === undefined) {
      break;
    }

    if (byteValue <= 127) {
      // TODO -> Interpret the next N+1 bytes literally.
      const N = byteValue + 1;
      const next = i + 1;

      // Read the next N bytes literally.
      for (let p = next; p < next + N; p++) {
        pixelData[pixelDataIndex] = uInt8Frame[p];
        pixelDataIndex++;
      }
      i += N + 1;
    }

    if (byteValue >= 129) {
      const N = 257 - byteValue;
      const next = i + 1;

      // Repeat the next byte N times.
      for (let p = 0; p < N; p++) {
        pixelData[pixelDataIndex] = uInt8Frame[next];
        pixelDataIndex++;
      }

      i += 2;
    }

    if (i === uInt8Frame.length) {
      break;
    }
  }
}

export { encode, decode };
