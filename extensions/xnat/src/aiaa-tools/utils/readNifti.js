import Nifti from 'nifti-reader-js';

async function readNifti(data) {
  let niftiArrayBuffer = data.slice(0);
  let image;
  let header;
  const maskImageSize = {
    width: 0,
    height: 0,
    numberOfFrames: 0,
  };

  // Decompress if zipped
  if (Nifti.isCompressed(niftiArrayBuffer)) {
    niftiArrayBuffer = Nifti.decompress(niftiArrayBuffer);
  }

  if(Nifti.isNIFTI(niftiArrayBuffer)) {
    header = Nifti.readHeader(niftiArrayBuffer);
    image = Nifti.readImage(header, niftiArrayBuffer);

    const dims = header.dims;
    maskImageSize.width = dims[1];
    maskImageSize.height = dims[2];
    maskImageSize.numberOfFrames = dims[3];

    if (Math.abs(header.quatern_d) < 0.5) {
      const TypedArray = TypedArrayType(header.numBitsPerVoxel);

      // Convert to DICOM PCS <=> Nifti as reverse row-major
      // Since we know that the mask belong to the reference image and has the
      // same dimensions, reversing data for each slice will do the trick
      const slicelengthInBytes = image.byteLength / dims[3];
      const sliceLength = dims[2] * dims[1]; // rows x columns
      for (let s = 0; s < dims[3]; s++) {
        const sliceOffset = slicelengthInBytes * s;
        const sliceData = new TypedArray(image, sliceOffset, sliceLength);
        sliceData.reverse();
      }
    }

    // debugger;
    // if (Nifti.hasExtension(header)) {
    //   const extnsion = Nifti.readExtension(header, niftiArrayBuffer);
    // }
  }

  return {
    header,
    image,
    maskImageSize,
  };
}

function TypedArrayType(numBitsPerVoxel) {
  switch (numBitsPerVoxel) {
    case 8:
      return Int8Array;
    case 16:
      return Int16Array;
    case 32:
      return Int32Array;
    default:
      console.error(
        `No method for parsing ArrayBuffer to ${numBitsPerVoxel}-bit array`
      );
  }

  return null;
}

export default readNifti;
